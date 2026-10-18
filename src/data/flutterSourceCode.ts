export interface FlutterFile {
  filename: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

export const FLUTTER_CODEBASE: FlutterFile[] = [
  {
    filename: "audio_player_service.dart",
    path: "lib/services/audio_player_service.dart",
    language: "dart",
    description: "Pure Quran Audio Engine using just_audio & just_audio_background: single dedicated Quran recitation stream with Auto-Resume position tracking, lifecycle preservation, MediaItem lockscreen controls, AudioSession focus & ducking.",
    code: `import 'dart:async';
import 'dart:io';
import 'package:audio_session/audio_session.dart';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'quran_api_service.dart';
import 'download_service.dart';
import 'playback_history_service.dart';

class QuranAudioHandler extends ChangeNotifier with WidgetsBindingObserver {
  // Pure Quran Audio Engine powered by just_audio & just_audio_background
  final AudioPlayer _quranPlayer = AudioPlayer();
  final PlaybackHistoryService _historyService = PlaybackHistoryService();

  Reciter? _currentReciter;
  Surah? _currentSurah;
  List<Surah> _queue = QuranApiService.allSurahs;
  int _currentIndex = 0;
  double _quranVolume = 1.0;
  Timer? _positionSaveTimer;

  Reciter? get currentReciter => _currentReciter;
  Surah? get currentSurah => _currentSurah;
  AudioPlayer get player => _quranPlayer;
  double get quranVolume => _quranVolume;
  PlaybackHistoryService get historyService => _historyService;

  QuranAudioHandler() {
    WidgetsBinding.instance.addObserver(this);
    _initAudioSession();
    _initAudioStreams();
    _initRestoreFromHistory();
  }

  /// Restores last played Surah in a paused ready state on fresh launch
  Future<void> _initRestoreFromHistory() async {
    final history = await _historyService.loadLastPlayback();
    if (history != null && _currentSurah == null) {
      _currentSurah = QuranApiService.allSurahs.firstWhere(
        (s) => s.number == history.surahNumber,
        orElse: () => QuranApiService.allSurahs.first,
      );
      _currentReciter = Reciter(
        id: history.reciterId,
        name: history.reciterName,
        arabicName: history.arabicName,
        style: 'Hafs',
        photoUrl: history.reciterPhoto,
        serverUrl: 'https://server.mp3quran.net/\${history.reciterId}/',
        country: 'Global',
      );
      notifyListeners();
    }
  }

  /// App Lifecycle Observer: saves exact playback position on app pause, inactive, or detach
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive ||
        state == AppLifecycleState.detached) {
      _persistCurrentPosition();
    }
  }

  void _persistCurrentPosition() {
    if (_currentSurah == null || _currentReciter == null) return;
    final posSeconds = _quranPlayer.position.inSeconds;
    final totalSeconds = _quranPlayer.duration?.inSeconds ?? 0;
    if (posSeconds > 0) {
      _historyService.savePlayback(
        surahNumber: _currentSurah!.number,
        surahName: _currentSurah!.name,
        arabicName: _currentSurah!.arabicName,
        reciterId: _currentReciter!.id,
        reciterName: _currentReciter!.name,
        reciterPhoto: _currentReciter!.photoUrl,
        positionSeconds: posSeconds,
        totalDurationSeconds: totalSeconds,
      );
    }
  }

  /// Configure AudioSession for music/speech with focus and phone call interruption handling
  Future<void> _initAudioSession() async {
    final session = await AudioSession.instance;
    await session.configure(const AudioSessionConfiguration.music());

    // Handle audio interruptions (e.g., incoming phone call, alarm)
    session.interruptionEventStream.listen((event) {
      if (event.begin) {
        switch (event.type) {
          case AudioInterruptionType.duck:
            _quranPlayer.setVolume(0.2);
            break;
          case AudioInterruptionType.pause:
          case AudioInterruptionType.unknown:
            _quranPlayer.pause();
            _persistCurrentPosition();
            break;
        }
      } else {
        switch (event.type) {
          case AudioInterruptionType.duck:
            _quranPlayer.setVolume(_quranVolume);
            break;
          case AudioInterruptionType.pause:
            _quranPlayer.play();
            break;
          case AudioInterruptionType.unknown:
            break;
        }
      }
    });

    // Automatically pause playback when headphones are disconnected
    session.becomingNoisyEventStream.listen((_) {
      _quranPlayer.pause();
      _persistCurrentPosition();
    });
  }

  void _initAudioStreams() {
    // Notify UI on player events
    _quranPlayer.playbackEventStream.listen((_) {
      notifyListeners();
    });

    _quranPlayer.playerStateStream.listen((state) {
      notifyListeners();

      if (state.playing) {
        // Start periodic 5-second position tracker
        _positionSaveTimer?.cancel();
        _positionSaveTimer = Timer.periodic(const Duration(seconds: 5), (_) {
          _persistCurrentPosition();
        });
      } else {
        // Save on pause or stop
        _positionSaveTimer?.cancel();
        _persistCurrentPosition();
      }

      // Auto-advance Surah on completion
      if (state.processingState == ProcessingState.completed) {
        skipToNext();
      }
    });
  }

  /// Streams Surah with standard lock screen controls and optional auto-resume seek
  Future<void> playSurah({
    required Reciter reciter,
    required Surah surah,
    List<Surah>? queue,
    Duration? initialPosition,
  }) async {
    _currentReciter = reciter;
    _currentSurah = surah;
    if (queue != null && queue.isNotEmpty) {
      _queue = queue;
      _currentIndex = queue.indexWhere((s) => s.number == surah.number);
      if (_currentIndex == -1) _currentIndex = 0;
    }

    final audioUrl = reciter.getSurahAudioUrl(surah.number);

    // Standard Lock Screen & Background Notification MediaItem via just_audio_background
    final mediaItem = MediaItem(
      id: audioUrl,
      album: 'Al-Quran Al-Kareem',
      title: '\${surah.number}. \${surah.name} (\${surah.arabicName})',
      artist: reciter.name,
      displayDescription: '\${surah.versesCount} Ayahs • \${surah.revelationType}',
      artUri: Uri.parse(reciter.photoUrl),
      extras: {
        'surahNumber': surah.number,
        'reciterId': reciter.id,
      },
    );

    try {
      // Check if Surah was downloaded locally on device
      final downloadService = DownloadService();
      final localPath = await downloadService.getLocalFilePath(reciter.id, surah.number);

      AudioSource audioSource;
      if (localPath != null && await File(localPath).exists()) {
        // Stream directly from local file with ZERO internet data consumption
        audioSource = AudioSource.file(
          localPath,
          tag: mediaItem.copyWith(
            album: 'Al-Quran Al-Kareem (Offline)',
            displayDescription: '\${surah.versesCount} Ayahs • Offline Recitation',
          ),
        );
      } else {
        // Stream live from Mp3Quran CDN
        audioSource = AudioSource.uri(
          Uri.parse(audioUrl),
          tag: mediaItem,
        );
      }

      await _quranPlayer.setAudioSource(audioSource);

      // Auto-Resume to exact second if provided
      if (initialPosition != null && initialPosition > Duration.zero) {
        await _quranPlayer.seek(initialPosition);
      }

      await _quranPlayer.setVolume(_quranVolume);
      await _quranPlayer.play();
      notifyListeners();
    } catch (e) {
      debugPrint('Playback error: \$e');
    }
  }

  /// Tapping "Continue listening" resumes directly from the saved second
  Future<void> resumeLastPlayback() async {
    final history = _historyService.lastPlayback ?? await _historyService.loadLastPlayback();
    if (history != null && history.positionSeconds > 0) {
      final surah = QuranApiService.allSurahs.firstWhere(
        (s) => s.number == history.surahNumber,
        orElse: () => QuranApiService.allSurahs.first,
      );
      final reciter = Reciter(
        id: history.reciterId,
        name: history.reciterName,
        arabicName: history.arabicName,
        style: 'Hafs',
        photoUrl: history.reciterPhoto,
        serverUrl: 'https://server.mp3quran.net/\${history.reciterId}/',
        country: 'Global',
      );
      await playSurah(
        reciter: reciter,
        surah: surah,
        initialPosition: Duration(seconds: history.positionSeconds),
      );
    } else {
      if (_quranPlayer.playing) {
        await _quranPlayer.pause();
        _persistCurrentPosition();
      } else {
        await _quranPlayer.play();
      }
    }
  }

  Future<void> setQuranVolume(double volume) async {
    _quranVolume = volume.clamp(0.0, 1.0);
    await _quranPlayer.setVolume(_quranVolume);
    notifyListeners();
  }

  Future<void> play() async => await _quranPlayer.play();
  Future<void> pause() async {
    await _quranPlayer.pause();
    _persistCurrentPosition();
  }
  Future<void> seek(Duration position) => _quranPlayer.seek(position);

  Future<void> skipForward([Duration duration = const Duration(seconds: 10)]) async {
    final newPos = _quranPlayer.position + duration;
    final total = _quranPlayer.duration ?? Duration.zero;
    await _quranPlayer.seek(newPos > total ? total : newPos);
  }

  Future<void> skipBackward([Duration duration = const Duration(seconds: 10)]) async {
    final newPos = _quranPlayer.position - duration;
    await _quranPlayer.seek(newPos < Duration.zero ? Duration.zero : newPos);
  }

  Future<void> skipToNext() async {
    if (_queue.isNotEmpty && _currentIndex + 1 < _queue.length && _currentReciter != null) {
      _currentIndex++;
      await playSurah(reciter: _currentReciter!, surah: _queue[_currentIndex], queue: _queue);
    }
  }

  Future<void> skipToPrevious() async {
    if (_queue.isNotEmpty && _currentIndex > 0 && _currentReciter != null) {
      _currentIndex--;
      await playSurah(reciter: _currentReciter!, surah: _queue[_currentIndex], queue: _queue);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _positionSaveTimer?.cancel();
    _persistCurrentPosition();
    _quranPlayer.dispose();
    super.dispose();
  }
}
`
  },
  {
    filename: "full_player_screen.dart",
    path: "lib/screens/full_player_screen.dart",
    language: "dart",
    description: "Full-Screen Audio Player Modal: clean header with Now Playing indicator, real reciter photo avatar with glow, favorite star, seeker, and bottom playback controls.",
    code: `import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/audio_player_service.dart';
import '../services/quran_api_service.dart';
import '../providers/reciters_provider.dart';
import '../widgets/surah_queue_sheet.dart';

class FullPlayerScreen extends StatelessWidget {
  final QuranAudioHandler audioHandler;
  final Surah surah;
  final Reciter reciter;

  const FullPlayerScreen({
    super.key,
    required this.audioHandler,
    required this.surah,
    required this.reciter,
  });

  @override
  Widget build(BuildContext context) {
    final recitersProvider = context.watch<RecitersProvider>();
    final isFav = recitersProvider.isFavourite(reciter.id);

    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      decoration: const BoxDecoration(
        color: Color(0xFF070B14),
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          child: Column(
            children: [
              // Pull Grab Handle
              Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 12),

              // Top Bar: Dismiss, Now Playing, Favorite Star
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white, size: 30),
                  ),

                  const Column(
                    children: [
                      Text('NOW PLAYING', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF10B981), letterSpacing: 1.5)),
                      Text('Pure Quran Recitation', style: TextStyle(fontSize: 10, color: Colors.white54)),
                    ],
                  ),

                  // Favorite Star Button
                  IconButton(
                    onPressed: () => recitersProvider.toggleFavourite(reciter.id),
                    icon: Icon(
                      isFav ? Icons.star_rounded : Icons.star_border_rounded,
                      color: isFav ? const Color(0xFFF59E0B) : Colors.white54,
                      size: 26,
                    ),
                  ),
                ],
              ),
              const Spacer(),

              // Centered Large Reciter Avatar Photo with Ambient Glow
              Container(
                width: 220,
                height: 220,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4), width: 3),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withOpacity(0.2),
                      blurRadius: 40,
                      spreadRadius: 4,
                    ),
                  ],
                ),
                child: ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: reciter.photoUrl,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: const Color(0xFF1E293B)),
                    errorWidget: (_, __, ___) => Container(
                      color: const Color(0xFF1E293B),
                      child: Center(
                        child: Text(reciter.arabicName.split(' ').first, style: const TextStyle(fontSize: 32, color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ),
                ),
              ),
              const Spacer(),

              // Titles
              Text(
                surah.arabicName,
                style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 4),
              Text(
                surah.name,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 2),
              Text(
                '\${reciter.name} • \${surah.versesCount} Ayahs',
                style: const TextStyle(fontSize: 13, color: Color(0xFF10B981), fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 20),

              // Audio Seeker Slider
              StreamBuilder<Duration>(
                stream: audioHandler.player.positionStream,
                builder: (context, snapshot) {
                  final position = snapshot.data ?? Duration.zero;
                  final duration = audioHandler.player.duration ?? Duration.zero;

                  return Column(
                    children: [
                      SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          trackHeight: 3.5,
                          thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                          activeTrackColor: const Color(0xFF10B981),
                          inactiveTrackColor: Colors.white12,
                          thumbColor: const Color(0xFF34D399),
                        ),
                        child: Slider(
                          value: position.inMilliseconds.clamp(0, duration.inMilliseconds).toDouble(),
                          max: duration.inMilliseconds > 0 ? duration.inMilliseconds.toDouble() : 1.0,
                          onChanged: (val) => audioHandler.seek(Duration(milliseconds: val.toInt())),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(_formatDuration(position), style: const TextStyle(fontSize: 11, color: Colors.white54)),
                            Text(_formatDuration(duration), style: const TextStyle(fontSize: 11, color: Colors.white54)),
                          ],
                        ),
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 10),

              // Main Playback Controls
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  IconButton(
                    icon: const Icon(Icons.shuffle_rounded, color: Colors.white54, size: 22),
                    onPressed: () {},
                  ),
                  IconButton(
                    icon: const Icon(Icons.skip_previous_rounded, color: Colors.white, size: 34),
                    onPressed: () => audioHandler.skipToPrevious(),
                  ),
                  IconButton(
                    icon: const Icon(Icons.replay_10_rounded, color: Colors.white70, size: 26),
                    onPressed: () {
                      final pos = audioHandler.player.position;
                      audioHandler.seek(pos - const Duration(seconds: 10));
                    },
                  ),
                  // Big Glowing Play/Pause Button
                  Container(
                    width: 66,
                    height: 66,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFF10B981),
                      boxShadow: [
                        BoxShadow(color: const Color(0xFF10B981).withOpacity(0.4), blurRadius: 20),
                      ],
                    ),
                    child: IconButton(
                      icon: Icon(
                        audioHandler.player.playing ? Icons.pause_rounded : Icons.play_arrow_rounded,
                        color: Colors.black,
                        size: 38,
                      ),
                      onPressed: () => audioHandler.player.playing ? audioHandler.pause() : audioHandler.play(),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.forward_10_rounded, color: Colors.white70, size: 26),
                    onPressed: () {
                      final pos = audioHandler.player.position;
                      audioHandler.seek(pos + const Duration(seconds: 10));
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.skip_next_rounded, color: Colors.white, size: 34),
                    onPressed: () => audioHandler.skipToNext(),
                  ),
                  IconButton(
                    icon: const Icon(Icons.repeat_rounded, color: Colors.white54, size: 22),
                    onPressed: () {},
                  ),
                ],
              ),
              const Spacer(),

              // Bottom Utility Bar: Volume Mixer, Speed, Queue
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Mute / Unmute Recitation Toggle
                  IconButton(
                    icon: Icon(
                      audioHandler.quranVolume == 0 ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                      color: Colors.white70,
                    ),
                    onPressed: () {
                      final newVol = audioHandler.quranVolume > 0 ? 0.0 : 1.0;
                      audioHandler.setQuranVolume(newVol);
                    },
                  ),

                  // Speed
                  TextButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.speed_rounded, size: 16, color: Colors.white70),
                    label: const Text('1.0x', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  ),

                  // 3-Line List Icon -> Opens "Continue playing" Surah Queue Sheet
                  IconButton(
                    icon: const Icon(Icons.queue_music_rounded, color: Colors.white70),
                    onPressed: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => SurahQueueSheet(audioHandler: audioHandler, reciter: reciter),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '\$m:\$s';
  }
}
`
  },
  {
    filename: "surah_queue_sheet.dart",
    path: "lib/widgets/surah_queue_sheet.dart",
    language: "dart",
    description: "Continue playing Surah Queue overlay: current reciter's photo header, search, and instant Surah streaming.",
    code: `import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../services/audio_player_service.dart';
import '../services/quran_api_service.dart';

class SurahQueueSheet extends StatefulWidget {
  final QuranAudioHandler audioHandler;
  final Reciter reciter;

  const SurahQueueSheet({super.key, required this.audioHandler, required this.reciter});

  @override
  State<SurahQueueSheet> createState() => _SurahQueueSheetState();
}

class _SurahQueueSheetState extends State<SurahQueueSheet> {
  String _search = '';
  final List<Surah> _surahs = QuranApiService.allSurahs;

  @override
  Widget build(BuildContext context) {
    final filtered = _surahs.where((s) =>
        s.name.toLowerCase().contains(_search.toLowerCase()) ||
        s.arabicName.contains(_search) ||
        s.number.toString() == _search.trim()).toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: Color(0xFF0C121E),
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 12),

          // Header with Reciter Photo
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: widget.reciter.photoUrl,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('CONTINUE PLAYING', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                      Text(widget.reciter.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close_rounded, color: Colors.white70),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF151F33),
                borderRadius: BorderRadius.circular(22),
              ),
              child: TextField(
                onChanged: (val) => setState(() => _search = val),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: const InputDecoration(
                  hintText: 'Search 114 Surahs...',
                  hintStyle: TextStyle(color: Colors.white38, fontSize: 13),
                  prefixIcon: Icon(Icons.search_rounded, color: Colors.white38, size: 20),
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // 114 Surahs List
          Expanded(
            child: ListView.builder(
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final surah = filtered[index];
                final isCurrent = widget.audioHandler.currentSurah?.number == surah.number;

                return ListTile(
                  onTap: () {
                    widget.audioHandler.playSurah(reciter: widget.reciter, surah: surah, queue: _surahs);
                    Navigator.pop(context);
                  },
                  leading: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: isCurrent ? const Color(0xFF10B981) : const Color(0xFF1A2338),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text(
                        surah.number.toString(),
                        style: TextStyle(fontWeight: FontWeight.bold, color: isCurrent ? Colors.black : Colors.white, fontSize: 12),
                      ),
                    ),
                  ),
                  title: Text(surah.name, style: TextStyle(fontWeight: FontWeight.bold, color: isCurrent ? const Color(0xFF10B981) : Colors.white, fontSize: 14)),
                  subtitle: Text('\${surah.englishMeaning} • \${surah.versesCount} verses', style: const TextStyle(fontSize: 11, color: Colors.white54)),
                  trailing: Text(surah.arabicName, style: const TextStyle(fontSize: 16, color: Colors.white70)),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
`
  },
  {
    filename: "reciter_avatar_card.dart",
    path: "lib/widgets/reciter_avatar_card.dart",
    language: "dart",
    description: "Reusable Reciter Avatar Card: 64x64 circular avatar with 1.5px frosted white border, floating translucent heart badge, and clean white medium first-name typography.",
    code: `import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class ReciterAvatarCard extends StatelessWidget {
  final String name;
  final String photoUrl;
  final VoidCallback? onTap;
  final bool isSelected;
  final bool isFavorite;
  final VoidCallback? onToggleFavorite;
  final double radius;
  final String? badge;

  const ReciterAvatarCard({
    super.key,
    required this.name,
    required this.photoUrl,
    this.onTap,
    this.isSelected = false,
    this.isFavorite = false,
    this.onToggleFavorite,
    this.radius = 34.0, // Reciter avatar size: radius: 34 (68x68 diameter)
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 88.0, // Increased width (84.0 - 90.0) so full name fits comfortably
        margin: const EdgeInsets.only(right: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // 68x68 Circular Avatar (radius: 34) with 1.5px frosted white border
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: radius * 2,
                  height: radius * 2,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF0B1017),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF00E676)
                          : Colors.white.withOpacity(0.12),
                      width: 1.5,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: const Color(0xFF00E676).withOpacity(0.35),
                              blurRadius: 15,
                              spreadRadius: 1,
                            )
                          ]
                        : null,
                  ),
                  child: ClipOval(
                    child: CachedNetworkImage(
                      imageUrl: photoUrl,
                      width: radius * 2,
                      height: radius * 2,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        color: const Color(0xFF0B1017),
                        child: const Center(
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Color(0xFF00E676),
                            ),
                          ),
                        ),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        color: const Color(0xFF0B1017),
                        child: Center(
                          child: Text(
                            name.isNotEmpty ? name[0] : 'ق',
                            style: const TextStyle(
                              color: Color(0xFF00E676),
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                // Floating translucent heart badge at the top-right corner
                if (onToggleFavorite != null)
                  Positioned(
                    top: -2,
                    right: -2,
                    child: GestureDetector(
                      onTap: onToggleFavorite,
                      child: Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withOpacity(0.2),
                            width: 1,
                          ),
                        ),
                        child: Icon(
                          isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                          size: 12,
                          color: isFavorite ? const Color(0xFFF43F5E) : Colors.white70,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),

            // Display FULL Reciter Name in 2-line wrapped text layout
            Text(
              name, // e.g. "Abdulrahman Al-Suwayid", "Yasser Al-Dosari", "Yussef Al-Suqair"
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                height: 1.2,
                letterSpacing: 0.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
`
  },
  {
    filename: "reciter_image_service.dart",
    path: "lib/services/reciter_image_service.dart",
    language: "dart",
    description: "Universal Reciter Photo Engine: authentic Wikimedia and verified public CDN portraits with clean frosted glass fallback.",
    code: `import 'package:flutter/material.dart';

class ReciterImageService {
  static const Map<String, String> _verifiedCdnMap = {
    // Authentic Verified Wikimedia & TVQuran Portraits
    'yasser': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Yasser_Al-Dossari.jpg/440px-Yasser_Al-Dossari.jpg',
    'yussef': 'https://tvquran.com/uploads/authors/images/%D9%8A%D9%88%D8%B3%D9%81%20%D8%A7%D9%84%D8%B5%D9%82%D9%8A%D8%B1.jpg',
    'fatih': 'https://pbs.twimg.com/profile_images/1131665675865243650/4Hw9G47L_400x400.jpg',
    'abdulrahman_suwayid': 'https://tvquran.com/uploads/authors/images/%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86%20%D8%A7%D9%84%D8%B3%D9%88%D9%8A%D8%AF.jpg',
    'afs': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Mishary_Rashid_Alafasy.jpg/440px-Mishary_Rashid_Alafasy.jpg',
    'basit': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Abdulbasit_Abdussamad.jpg/440px-Abdulbasit_Abdussamad.jpg',

    // Other Masters
    'sudais': 'https://static.qurancdn.com/images/reciters/9/abdur-rahman-as-sudais.jpeg',
    'shur': 'https://static.qurancdn.com/images/reciters/4/saud-ash-shuraym.jpeg',
    'maher': 'https://static.qurancdn.com/images/reciters/5/maher-al-mueaqly.jpeg',
    'baleela': 'https://static.qurancdn.com/images/reciters/11/bandar-baleela.jpeg',
    'juhany': 'https://static.qurancdn.com/images/reciters/12/abdullah-al-juhany.jpeg',
    'husr': 'https://static.qurancdn.com/images/reciters/2/mahmoud-khalil-al-hussary.jpeg',
    'minsh': 'https://static.qurancdn.com/images/reciters/3/muhammad-siddiq-al-minshawi.jpeg',
    'mustafa_ismail': 'https://static.qurancdn.com/images/reciters/13/mustafa-ismail.jpeg',
    's_gmd': 'https://static.qurancdn.com/images/reciters/7/saad-al-ghamdi.jpeg',
    'shatri': 'https://static.qurancdn.com/images/reciters/8/abu-bakr-ash-shatri.jpeg',
    'ajmy': 'https://static.qurancdn.com/images/reciters/14/ahmed-al-ajmy.jpeg',
    'idris': 'https://static.qurancdn.com/images/reciters/16/idris-abkar.jpeg',
    'balushi': 'https://static.qurancdn.com/images/reciters/19/hazza-al-balushi.jpeg',
    'raad': 'https://static.qurancdn.com/images/reciters/20/raad-al-kurdi.jpeg',
    'islam_sobhi': 'https://static.qurancdn.com/images/reciters/21/islam-sobhi.jpeg',
  };

  static String getVerifiedPhotoUrl({
    required String reciterId,
    required String name,
    String? currentUrl,
  }) {
    final id = reciterId.toLowerCase().trim();
    if (_verifiedCdnMap.containsKey(id)) {
      return _verifiedCdnMap[id]!;
    }

    final lower = name.toLowerCase();
    for (final entry in _verifiedCdnMap.entries) {
      if (lower.contains(entry.key)) return entry.value;
    }

    if (currentUrl != null && currentUrl.isNotEmpty) {
      return currentUrl;
    }

    return _verifiedCdnMap['yasser']!;
  }
}
`
  },
  {
    filename: "insights_service.dart",
    path: "lib/services/insights_service.dart",
    language: "dart",
    description: "Real-time second-by-second Quran listening habit & goal tracker, daily historical persistence, and zero-initial Day 0 streak engine.",
    code: `import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'audio_player_service.dart';

class WeeklyDayStatus {
  final String day;
  final String dateKey;
  final int minutes;
  final bool completed;
  final bool isToday;

  WeeklyDayStatus({
    required this.day,
    required this.dateKey,
    required this.minutes,
    required this.completed,
    required this.isToday,
  });
}

class InsightsService extends ChangeNotifier {
  static const String _recordsPrefix = 'quran_listen_v2_';
  static const String _goalKey = 'daily_listening_goal_mins_v2';
  static const String _streakKey = 'listening_streak_days_v2';
  static const String _bestStreakKey = 'best_listening_streak_days_v2';

  // Zero initial state for fresh users
  int _todaySeconds = 0;
  int _dailyGoalMinutes = 30;
  int _currentStreak = 0; // Starts at 0 Days
  int _bestRecordStreak = 0; // Starts at 0 Days
  final Map<String, int> _historyRecords = {};
  Timer? _timer;

  int get totalSecondsToday => _todaySeconds;
  // Convert seconds to minutes dynamically (totalSecondsToday ~/ 60)
  int get todayMinutes => _todaySeconds ~/ 60;
  int get dailyGoalMinutes => _dailyGoalMinutes;
  int get currentStreak => _currentStreak;
  int get bestRecordStreak => _bestRecordStreak;
  double get progressRatio => _dailyGoalMinutes > 0
      ? (_todaySeconds / (_dailyGoalMinutes * 60)).clamp(0.0, 1.0)
      : 0.0;

  int get thisWeekMinutes {
    final week = weeklyDays;
    return week.fold<int>(0, (sum, item) => sum + item.minutes);
  }

  List<WeeklyDayStatus> get weeklyDays {
    final now = DateTime.now();
    final dayOfWeek = (now.weekday - 1) % 7; // 0 = Mon, 6 = Sun
    final todayKey = _todayDateKey();
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return List.generate(7, (index) {
      final diff = index - dayOfWeek;
      final targetDate = now.add(Duration(days: diff));
      final key = '\${targetDate.year}-\${targetDate.month.toString().padLeft(2, '0')}-\${targetDate.day.toString().padLeft(2, '0')}';
      final isToday = key == todayKey;
      final seconds = isToday ? _todaySeconds : (_historyRecords[key] ?? 0);
      final minutes = seconds ~/ 60;
      final completed = minutes >= _dailyGoalMinutes && minutes > 0;

      return WeeklyDayStatus(
        day: dayLabels[index],
        dateKey: key,
        minutes: minutes,
        completed: completed,
        isToday: isToday,
      );
    });
  }

  InsightsService(QuranAudioHandler audioHandler) {
    _loadStoredData();
    _listenToPlayback(audioHandler);
  }

  Future<void> _loadStoredData() async {
    final prefs = await SharedPreferences.getInstance();
    final todayKey = _todayDateKey();
    // Default to 0 seconds, 0 days streak, 0 days best record for fresh user
    _todaySeconds = prefs.getInt('\$_recordsPrefix\$todayKey') ?? 0;
    _historyRecords[todayKey] = _todaySeconds;
    _dailyGoalMinutes = prefs.getInt(_goalKey) ?? 30;
    _currentStreak = prefs.getInt(_streakKey) ?? 0;
    _bestRecordStreak = prefs.getInt(_bestStreakKey) ?? 0;
    notifyListeners();
  }

  void _listenToPlayback(QuranAudioHandler audioHandler) {
    // Attach a global listener to the Quran AudioPlayer state everywhere
    // Whenever _quranPlayer.playing == true (Home, Mini Player, Surah List, Reciter profile), start 1-sec timer
    audioHandler.player.playingStream.listen((isPlaying) {
      if (isPlaying) {
        _timer?.cancel();
        _timer = Timer.periodic(const Duration(seconds: 1), (_) {
          _incrementSecond();
        });
      } else {
        _timer?.cancel();
      }
    });
  }

  Future<void> _incrementSecond() async {
    _todaySeconds++;
    final todayKey = _todayDateKey();
    _historyRecords[todayKey] = _todaySeconds;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('\$_recordsPrefix\$todayKey', _todaySeconds);

    // Changes to 1 Day only after completing at least 1 minute (60 seconds) of listening today
    if (_todaySeconds >= 60 && _currentStreak < 1) {
      _currentStreak = 1;
      await prefs.setInt(_streakKey, _currentStreak);
    }

    if (_currentStreak > _bestRecordStreak) {
      _bestRecordStreak = _currentStreak;
      await prefs.setInt(_bestStreakKey, _bestRecordStreak);
    }
    notifyListeners();
  }

  Future<void> setDailyGoal(int minutes) async {
    _dailyGoalMinutes = minutes;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_goalKey, minutes);
    notifyListeners();
  }

  String _todayDateKey() {
    final now = DateTime.now();
    return '\${now.year}-\${now.month.toString().padLeft(2, '0')}-\${now.day.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
`
  },
  {
    filename: "insights_screen.dart",
    path: "lib/screens/insights_screen.dart",
    language: "dart",
    description: "Interactive Quran Listening Insights & Goal Tracker screen with semi-circular SVG arc gauge, Day 0 initial state, real-time seconds counter, and weekly reflection tracker.",
    code: `import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/insights_service.dart';
import '../services/audio_player_service.dart';

class InsightsScreen extends StatelessWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final insights = context.watch<InsightsService>();
    final audioHandler = context.watch<QuranAudioHandler>();

    return Scaffold(
      backgroundColor: const Color(0xFF070B14),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Listening Insights & Goals', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            Text('Build consistency with daily Quran reflection', style: TextStyle(fontSize: 11, color: Colors.white54)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          children: [
            // Semi-Circular Gauge Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                gradient: const LinearGradient(
                  colors: [Color(0xFF131D31), Color(0xFF0D1525), Color(0xFF070A12)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('TODAY\\'S LISTENING', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF10B981), letterSpacing: 1.2)),
                      // Goal selector button
                      PopupMenuButton<int>(
                        onSelected: (mins) => insights.setDailyGoal(mins),
                        itemBuilder: (_) => [15, 30, 45, 60].map((m) => PopupMenuItem(value: m, child: Text('\$m minutes'))).toList(),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white10),
                          ),
                          child: Text('Goal: \${insights.dailyGoalMinutes} mins', style: const TextStyle(fontSize: 11, color: Colors.white70)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Arc Gauge Painter
                  SizedBox(
                    height: 120,
                    width: 200,
                    child: CustomPaint(
                      painter: _ArcGaugePainter(progress: insights.progressRatio),
                      child: Align(
                        alignment: Alignment.bottomCenter,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('\${insights.todayMinutes} min', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                            Text('\${(insights.progressRatio * 100).toInt()}% completed of \${insights.dailyGoalMinutes} min goal', style: const TextStyle(fontSize: 10, color: Color(0xFF10B981))),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Action Button
                  ElevatedButton.icon(
                    onPressed: () => audioHandler.player.playing ? audioHandler.pause() : audioHandler.play(),
                    icon: Icon(audioHandler.player.playing ? Icons.pause : Icons.play_arrow, size: 16, color: Colors.black),
                    label: Text(audioHandler.player.playing ? 'Pause Listening' : 'Continue listening (\${audioHandler.currentSurah?.name ?? "Al-Baqarah"})', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      shape: const StadiumBorder(),
                      minimumSize: const Size(double.infinity, 44),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3 Stat Cards (Start at 0 for fresh user)
            Row(
              children: [
                Expanded(child: _buildMetricCard(insights.currentStreak == 0 ? '0 Days' : (insights.currentStreak == 1 ? '1 Day' : '\${insights.currentStreak} Days'), 'Current Streak', Icons.local_fire_department, Colors.amber)),
                const SizedBox(width: 8),
                Expanded(child: _buildMetricCard('\${insights.thisWeekMinutes} Min', 'This Week', Icons.access_time_rounded, const Color(0xFF10B981))),
                const SizedBox(width: 8),
                Expanded(child: _buildMetricCard('\${insights.bestRecordStreak} Days', 'Best Record', Icons.emoji_events_rounded, Colors.lightBlue)),
              ],
            ),
            const SizedBox(height: 16),

            // Weekly Reflection Tracker (Mon - Sun, all start unchecked / empty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF101726),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.white.withOpacity(0.06)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.auto_awesome_rounded, color: Colors.amber, size: 16),
                          SizedBox(width: 6),
                          Text('Weekly Reflection Tracker', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 0.5)),
                        ],
                      ),
                      Text(
                        '\${insights.weeklyDays.where((d) => d.completed).length} / 7 Days Active',
                        style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: insights.weeklyDays.map((item) {
                      return Column(
                        children: [
                          Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: item.completed
                                  ? const Color(0xFF10B981)
                                  : item.isToday
                                      ? Colors.white.withOpacity(0.06)
                                      : Colors.white.withOpacity(0.03),
                              border: Border.all(
                                color: item.completed
                                    ? const Color(0xFF10B981)
                                    : item.isToday
                                        ? const Color(0xFF10B981).withOpacity(0.6)
                                        : Colors.white.withOpacity(0.08),
                                width: item.isToday ? 1.5 : 1.0,
                              ),
                            ),
                            child: Icon(
                              item.completed ? Icons.check_circle_rounded : Icons.radio_button_unchecked,
                              size: 16,
                              color: item.completed
                                  ? Colors.black
                                  : item.isToday
                                      ? const Color(0xFF10B981)
                                      : Colors.white30,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            item.day,
                            style: TextStyle(
                              fontSize: 10,
                              color: item.isToday ? const Color(0xFF10B981) : Colors.white60,
                              fontWeight: item.isToday ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                        ],
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String value, String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF101726),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.white54)),
        ],
      ),
    );
  }
}

class _ArcGaugePainter extends CustomPainter {
  final double progress;
  _ArcGaugePainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height);
    final radius = size.width / 2 - 12;

    // Background track arc
    final trackPaint = Paint()
      ..color = Colors.white.withOpacity(0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), math.pi, math.pi, false, trackPaint);

    // Active progress arc
    final progressPaint = Paint()
      ..color = const Color(0xFF10B981)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), math.pi, math.pi * progress, false, progressPaint);
  }

  @override
  bool shouldRepaint(_ArcGaugePainter oldDelegate) => oldDelegate.progress != progress;
}
`
  },
  {
    filename: "onboarding_reciters_screen.dart",
    path: "lib/screens/onboarding_reciters_screen.dart",
    language: "dart",
    description: "First-Launch Reciter Onboarding: full-screen selection grid with real portraits, checkmark badges, and instant favorites persistence.",
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/reciters_provider.dart';
import '../widgets/reciter_avatar_card.dart';
import 'home_screen.dart';

class OnboardingRecitersScreen extends StatefulWidget {
  const OnboardingRecitersScreen({super.key});

  static const String prefKey = 'is_first_launch_done';

  @override
  State<OnboardingRecitersScreen> createState() => _OnboardingRecitersScreenState();
}

class _OnboardingRecitersScreenState extends State<OnboardingRecitersScreen> {
  final Set<String> _selectedReciterIds = {'yasser', 'afs', 'maher', 'basit'};

  void _toggleReciter(String id) {
    setState(() {
      if (_selectedReciterIds.contains(id)) {
        if (_selectedReciterIds.length > 1) {
          _selectedReciterIds.remove(id);
        }
      } else {
        _selectedReciterIds.add(id);
      }
    });
  }

  Future<void> _completeOnboarding() async {
    final provider = context.read<RecitersProvider>();
    for (final id in _selectedReciterIds) {
      if (!provider.isFavourite(id)) {
        provider.toggleFavourite(id);
      }
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(OnboardingRecitersScreen.prefKey, true);

    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RecitersProvider>();
    final allReciters = provider.allReciters;

    return Scaffold(
      backgroundColor: const Color(0xFF070B14),
      body: SafeArea(
        child: Column(
          children: [
            // Header Zone
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
              child: Column(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                    ),
                    child: const Icon(Icons.menu_book_rounded, color: Color(0xFF10B981), size: 24),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Choose Your Favourite Reciters',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Select your preferred Qaris to personalize your daily feed',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.white60),
                  ),
                ],
              ),
            ),

            // Responsive Qari Selection Grid
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 14,
                  crossAxisSpacing: 10,
                  childAspectRatio: 0.78,
                ),
                itemCount: allReciters.length,
                itemBuilder: (context, index) {
                  final reciter = allReciters[index];
                  final isSelected = _selectedReciterIds.contains(reciter.id);

                  return GestureDetector(
                    onTap: () => _toggleReciter(reciter.id),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF0F1E2E) : const Color(0xFF0E1524),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF10B981) : Colors.white.withOpacity(0.08),
                          width: isSelected ? 1.8 : 1.0,
                        ),
                      ),
                      child: Stack(
                        children: [
                          Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                ReciterAvatarCard(
                                  name: reciter.name,
                                  photoUrl: reciter.photoUrl,
                                  radius: 34,
                                  isSelected: isSelected,
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            const Positioned(
                              top: 2,
                              right: 2,
                              child: CircleAvatar(
                                radius: 10,
                                backgroundColor: Color(0xFF10B981),
                                child: Icon(Icons.check, size: 13, color: Colors.black),
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // Bottom Floating Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF0C121E),
                border: Border(top: BorderSide(color: Colors.white.withOpacity(0.08))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('\${_selectedReciterIds.length} Qaris Selected',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13)),
                        const Text('Can be modified anytime', style: TextStyle(color: Colors.white54, fontSize: 11)),
                      ],
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: _completeOnboarding,
                    icon: const Icon(Icons.arrow_forward_rounded, color: Colors.black, size: 16),
                    label: Text('Continue (\${_selectedReciterIds.length})',
                        style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      shape: const StadiumBorder(),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
`
  },
  {
    filename: "download_service.dart",
    path: "lib/services/download_service.dart",
    language: "dart",
    description: "One-Tap Surah Download Engine: downloads MP3 files locally to device storage via dio & path_provider, tracks real-time progress, stores rich metadata (Surah, Reciter, File size), and provides local offline playback paths.",
    code: `import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'quran_api_service.dart';

class DownloadedSurahItem {
  final String key; // reciterId-surahNumber
  final int surahNumber;
  final String surahName;
  final String arabicName;
  final String reciterId;
  final String reciterName;
  final String reciterPhotoUrl;
  final int fileSizeBytes;
  final String filePath;
  final DateTime downloadedAt;

  DownloadedSurahItem({
    required this.key,
    required this.surahNumber,
    required this.surahName,
    required this.arabicName,
    required this.reciterId,
    required this.reciterName,
    required this.reciterPhotoUrl,
    required this.fileSizeBytes,
    required this.filePath,
    required this.downloadedAt,
  });

  String get fileSizeMB => (fileSizeBytes / (1024 * 1024)).toStringAsFixed(1);

  Map<String, dynamic> toJson() => {
        'key': key,
        'surahNumber': surahNumber,
        'surahName': surahName,
        'arabicName': arabicName,
        'reciterId': reciterId,
        'reciterName': reciterName,
        'reciterPhotoUrl': reciterPhotoUrl,
        'fileSizeBytes': fileSizeBytes,
        'filePath': filePath,
        'downloadedAt': downloadedAt.toIso8601String(),
      };

  factory DownloadedSurahItem.fromJson(Map<String, dynamic> json) => DownloadedSurahItem(
        key: json['key'] ?? '',
        surahNumber: json['surahNumber'] ?? 1,
        surahName: json['surahName'] ?? '',
        arabicName: json['arabicName'] ?? '',
        reciterId: json['reciterId'] ?? '',
        reciterName: json['reciterName'] ?? '',
        reciterPhotoUrl: json['reciterPhotoUrl'] ?? '',
        fileSizeBytes: json['fileSizeBytes'] ?? (4 * 1024 * 1024),
        filePath: json['filePath'] ?? '',
        downloadedAt: DateTime.tryParse(json['downloadedAt'] ?? '') ?? DateTime.now(),
      );
}

class DownloadService extends ChangeNotifier {
  static const String _registryKey = 'downloaded_surahs_registry_v2';
  static const String _metaKey = 'downloaded_surahs_meta_v2';
  final Dio _dio = Dio();
  final Map<String, double> _downloadProgress = {};
  final Set<String> _downloadedKeys = {};
  final List<DownloadedSurahItem> _downloadedItems = [];

  List<DownloadedSurahItem> get downloadedItems => List.unmodifiable(_downloadedItems);
  int get totalCount => _downloadedItems.length;

  double get totalSizeMB {
    final bytes = _downloadedItems.fold<int>(0, (sum, i) => sum + i.fileSizeBytes);
    return double.parse((bytes / (1024 * 1024)).toStringAsFixed(1));
  }

  bool isDownloaded(String reciterId, int surahNumber) =>
      _downloadedKeys.contains('\$reciterId-\$surahNumber');

  double? getProgress(String reciterId, int surahNumber) =>
      _downloadProgress['\$reciterId-\$surahNumber'];

  DownloadService() {
    _loadRegistry();
  }

  Future<void> _loadRegistry() async {
    final prefs = await SharedPreferences.getInstance();
    final rawKeys = prefs.getStringList(_registryKey) ?? [];
    _downloadedKeys.addAll(rawKeys);

    final rawMeta = prefs.getStringList(_metaKey) ?? [];
    _downloadedItems.clear();
    for (final itemStr in rawMeta) {
      try {
        _downloadedItems.add(DownloadedSurahItem.fromJson(jsonDecode(itemStr)));
      } catch (_) {}
    }
    notifyListeners();
  }

  Future<String> _getSurahFilePath(String reciterId, int surahNumber) async {
    final dir = await getApplicationDocumentsDirectory();
    final padded = surahNumber.toString().padLeft(3, '0');
    return '\${dir.path}/audio/\${reciterId}_\$padded.mp3';
  }

  Future<String?> getLocalFilePath(String reciterId, int surahNumber) async {
    if (!isDownloaded(reciterId, surahNumber)) return null;
    final path = await _getSurahFilePath(reciterId, surahNumber);
    final file = File(path);
    return (await file.exists()) ? path : null;
  }

  Future<bool> downloadSurah({
    required Surah surah,
    required Reciter reciter,
  }) async {
    final key = '\${reciter.id}-\${surah.number}';
    final targetPath = await _getSurahFilePath(reciter.id, surah.number);
    final file = File(targetPath);
    await file.parent.create(recursive: true);

    final padded = surah.number.toString().padLeft(3, '0');
    final remoteUrl = '\${reciter.serverUrl}\$padded.mp3';

    _downloadProgress[key] = 0.05;
    notifyListeners();

    try {
      await _dio.download(
        remoteUrl,
        targetPath,
        onReceiveProgress: (received, total) {
          if (total > 0) {
            _downloadProgress[key] = received / total;
            notifyListeners();
          }
        },
      );

      _downloadProgress.remove(key);
      _downloadedKeys.add(key);

      final fileLength = await file.length();
      final newItem = DownloadedSurahItem(
        key: key,
        surahNumber: surah.number,
        surahName: surah.name,
        arabicName: surah.arabicName,
        reciterId: reciter.id,
        reciterName: reciter.name,
        reciterPhotoUrl: reciter.photoUrl,
        fileSizeBytes: fileLength > 0 ? fileLength : (4 * 1024 * 1024),
        filePath: targetPath,
        downloadedAt: DateTime.now(),
      );

      _downloadedItems.removeWhere((i) => i.key == key);
      _downloadedItems.insert(0, newItem);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_registryKey, _downloadedKeys.toList());
      await prefs.setStringList(
        _metaKey,
        _downloadedItems.map((i) => jsonEncode(i.toJson())).toList(),
      );
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Download error: \$e');
      _downloadProgress.remove(key);
      notifyListeners();
      return false;
    }
  }

  Future<void> deleteDownload(String reciterId, int surahNumber) async {
    final key = '\$reciterId-\$surahNumber';
    final targetPath = await _getSurahFilePath(reciterId, surahNumber);
    final file = File(targetPath);
    if (await file.exists()) {
      await file.delete();
    }
    _downloadedKeys.remove(key);
    _downloadedItems.removeWhere((i) => i.key == key);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_registryKey, _downloadedKeys.toList());
    await prefs.setStringList(
      _metaKey,
      _downloadedItems.map((i) => jsonEncode(i.toJson())).toList(),
    );
    notifyListeners();
  }

  Future<void> clearAllDownloads() async {
    for (final item in _downloadedItems) {
      try {
        final file = File(item.filePath);
        if (await file.exists()) {
          await file.delete();
        }
      } catch (_) {}
    }
    _downloadedKeys.clear();
    _downloadedItems.clear();
    _downloadProgress.clear();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_registryKey);
    await prefs.remove(_metaKey);
    notifyListeners();
  }
}
`
  },
  {
    filename: "surah_list_tile.dart",
    path: "lib/widgets/surah_list_tile.dart",
    language: "dart",
    description: "Reusable Surah List Tile Widget: displays Ayah count, Arabic name, playing state, and sleek one-tap download button with progress ring and delete confirmation.",
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/download_service.dart';
import '../services/audio_player_service.dart';
import '../services/quran_api_service.dart';

class SurahListTile extends StatelessWidget {
  final Surah surah;
  final Reciter reciter;
  final VoidCallback onTap;

  const SurahListTile({
    super.key,
    required this.surah,
    required this.reciter,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final downloadService = context.watch<DownloadService>();
    final audioHandler = context.watch<QuranAudioHandler>();

    final isCurrent = audioHandler.currentSurah?.number == surah.number;
    final isPlaying = isCurrent && audioHandler.player.playing;
    final isDownloaded = downloadService.isDownloaded(reciter.id, surah.number);
    final progress = downloadService.getProgress(reciter.id, surah.number);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: isCurrent ? const Color(0xFF0F1E2E) : const Color(0xFF0D1525),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isCurrent ? const Color(0xFF10B981).withOpacity(0.5) : Colors.white.withOpacity(0.06),
        ),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
        leading: Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: isCurrent ? const Color(0xFF10B981) : Colors.white.withOpacity(0.06),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Center(
            child: Text(
              surah.number.toString(),
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isCurrent ? Colors.black : Colors.white,
                fontSize: 12,
              ),
            ),
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                surah.name,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isCurrent ? const Color(0xFF10B981) : Colors.white,
                  fontSize: 14,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (isDownloaded)
              Container(
                margin: const EdgeInsets.only(left: 6),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('Offline', style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.bold)),
              ),
          ],
        ),
        subtitle: Text('\${surah.englishMeaning} • \${surah.versesCount} Ayahs',
            style: const TextStyle(fontSize: 11, color: Colors.white54)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(surah.arabicName, style: const TextStyle(fontSize: 16, color: Colors.white70)),
            const SizedBox(width: 10),

            // Modern One-Tap Download Button
            IconButton(
              iconSize: 22,
              visualDensity: VisualDensity.compact,
              padding: EdgeInsets.zero,
              onPressed: () {
                if (isDownloaded) {
                  _showDeleteConfirmSheet(context, downloadService);
                } else if (progress == null) {
                  downloadService.downloadSurah(surah: surah, reciter: reciter);
                }
              },
              icon: progress != null
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        value: progress > 0.05 ? progress : null,
                        strokeWidth: 2,
                        color: const Color(0xFF10B981),
                      ),
                    )
                  : Icon(
                      isDownloaded ? Icons.check_circle_rounded : Icons.arrow_circle_down_rounded,
                      color: isDownloaded ? const Color(0xFF10B981) : Colors.white38,
                    ),
            ),

            // Play / Pause Indicator
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isCurrent ? const Color(0xFF10B981) : Colors.white.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                size: 18,
                color: isCurrent ? Colors.black : Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteConfirmSheet(BuildContext context, DownloadService service) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0C121E),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.offline_pin_rounded, color: Color(0xFF10B981), size: 36),
            const SizedBox(height: 12),
            Text('Downloaded: \${surah.name}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 6),
            const Text('Audio is saved on your device for data-free offline listening.',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.white60)),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () {
                service.deleteDownload(reciter.id, surah.number);
                Navigator.pop(context);
              },
              icon: const Icon(Icons.delete_outline_rounded, color: Colors.white),
              label: const Text('Delete Downloaded Audio', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                shape: const StadiumBorder(),
                minimumSize: const Size(double.infinity, 44),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
`
  },
  {
    filename: "home_screen.dart",
    path: "lib/screens/home_screen.dart",
    language: "dart",
    description: "Production Home Screen: TopBar flows directly into the featured reciter card (no banners), favourites carousel, one-tap downloadable Surah library, and sticky frosted mini player.",
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/audio_player_service.dart';
import '../providers/reciters_provider.dart';
import '../services/quran_api_service.dart';
import '../widgets/reciter_avatar_card.dart';
import '../widgets/surah_list_tile.dart';
import '../widgets/mini_player_widget.dart';
import 'reciters_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final audioHandler = context.watch<QuranAudioHandler>();
    final recitersProvider = context.watch<RecitersProvider>();

    final featuredReciter = recitersProvider.allReciters.firstWhere(
      (r) => r.id == 'yasser',
      orElse: () => recitersProvider.allReciters.first,
    );

    final history = audioHandler.historyService.lastPlayback;
    final hasHistory = history != null && history.positionSeconds > 0;

    final activeReciter = hasHistory
        ? recitersProvider.allReciters.firstWhere(
            (r) => r.id == history.reciterId,
            orElse: () => featuredReciter,
          )
        : featuredReciter;

    final activeSurah = hasHistory
        ? QuranApiService.allSurahs.firstWhere(
            (s) => s.number == history.surahNumber,
            orElse: () => QuranApiService.allSurahs.first,
          )
        : QuranApiService.allSurahs.first;

    final isPlayingActive = audioHandler.player.playing && audioHandler.currentReciter?.id == activeReciter.id;

    return Scaffold(
      backgroundColor: const Color(0xFF070B14),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Row(
          children: [
            Icon(Icons.menu_book_rounded, color: Color(0xFF10B981), size: 24),
            SizedBox(width: 10),
            Text('Al-Quran', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
            SizedBox(width: 8),
            Chip(
              label: Text('100% FREE', style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.bold)),
              backgroundColor: Color(0xFF0F231D),
              padding: EdgeInsets.zero,
              visualDensity: VisualDensity.compact,
            ),
          ],
        ),
      ),
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // 1. Featured Reciter Card: dynamically reflects last played position & auto-resumes
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF142036), Color(0xFF0D1525), Color(0xFF070B14)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      border: Border.all(color: Colors.white.withOpacity(0.08)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            // Authentic portrait avatar with live green pulse
                            Stack(
                              clipBehavior: Clip.none,
                              children: [
                                ReciterAvatarCard(
                                  name: activeReciter.name,
                                  photoUrl: activeReciter.photoUrl,
                                  radius: 36,
                                ),
                                const Positioned(
                                  top: 0,
                                  right: 14,
                                  child: CircleAvatar(
                                    radius: 5,
                                    backgroundColor: Color(0xFF10B981),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    hasHistory ? 'CONTINUE LISTENING' : 'FROM YOUR FAVOURITES',
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981), letterSpacing: 1.1),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    activeReciter.name,
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '\${activeSurah.number}. \${activeSurah.name} (\${activeSurah.arabicName})',
                                    style: const TextStyle(fontSize: 13, color: Color(0xFF38EF7D), fontWeight: FontWeight.w600),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),

                                  // Resumes from MM:SS subtitle and progress
                                  if (hasHistory) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      'Resumes from \${history.formattedPosition} (\${history.progressPercent}%)',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Color(0xFF10B981),
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'monospace',
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(2),
                                      child: LinearProgressIndicator(
                                        value: history.progressRatio,
                                        backgroundColor: Colors.white12,
                                        valueColor: const AlwaysStoppedAnimation(Color(0xFF10B981)),
                                        minHeight: 3,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // Big "Continue listening" button: seeks to exact second and plays
                        ElevatedButton.icon(
                          onPressed: () {
                            if (isPlayingActive) {
                              audioHandler.pause();
                            } else if (hasHistory) {
                              audioHandler.resumeLastPlayback();
                            } else {
                              audioHandler.playSurah(
                                reciter: activeReciter,
                                surah: activeSurah,
                                queue: QuranApiService.allSurahs,
                              );
                            }
                          },
                          icon: Icon(
                            isPlayingActive ? Icons.pause_rounded : Icons.play_arrow_rounded,
                            color: Colors.black,
                            size: 18,
                          ),
                          label: Text(
                            isPlayingActive
                                ? 'Pause playback'
                                : (hasHistory
                                    ? 'Continue from \${history.formattedPosition}'
                                    : 'Continue listening'),
                            style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            shape: const StadiumBorder(),
                            minimumSize: const Size(double.infinity, 44),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // 2. Favourites Carousel Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Your favourites', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      TextButton(
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RecitersScreen())),
                        child: const Text('Explore all', style: TextStyle(color: Color(0xFF10B981), fontSize: 12)),
                      ),
                    ],
                  ),
                ),
              ),

              // 3. Favourites Horizontal Carousel (Full 2-line names, width 88.0, radius 34)
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 148,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: recitersProvider.favouriteReciters.length,
                    itemBuilder: (context, index) {
                      final reciter = recitersProvider.favouriteReciters[index];
                      final isSelected = audioHandler.currentReciter?.id == reciter.id;

                      return GestureDetector(
                        onTap: () {
                          audioHandler.playSurah(
                            reciter: reciter,
                            surah: QuranApiService.allSurahs.first,
                            queue: QuranApiService.allSurahs,
                          );
                        },
                        behavior: HitTestBehavior.opaque,
                        child: Container(
                          width: 88.0, // Increased width (84.0 - 90.0) so full name fits neatly
                          margin: const EdgeInsets.only(right: 12),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              // Reciter Avatar (radius: 34, 68x68 diameter)
                              Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Container(
                                    width: 68.0,
                                    height: 68.0,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: const Color(0xFF0B1017),
                                      border: Border.all(
                                        color: isSelected
                                            ? const Color(0xFF00E676)
                                            : Colors.white.withOpacity(0.12),
                                        width: 1.5,
                                      ),
                                      boxShadow: isSelected
                                          ? [
                                              BoxShadow(
                                                color: const Color(0xFF00E676).withOpacity(0.35),
                                                blurRadius: 15,
                                                spreadRadius: 1,
                                              )
                                            ]
                                          : null,
                                    ),
                                    child: ClipOval(
                                      child: CachedNetworkImage(
                                        imageUrl: reciter.photoUrl,
                                        width: 68.0,
                                        height: 68.0,
                                        fit: BoxFit.cover,
                                        placeholder: (_, __) => Container(
                                          color: const Color(0xFF0B1017),
                                          child: const Center(
                                            child: SizedBox(
                                              width: 16,
                                              height: 16,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: Color(0xFF00E676),
                                              ),
                                            ),
                                          ),
                                        ),
                                        errorWidget: (_, __, ___) => Container(
                                          color: const Color(0xFF0B1017),
                                          child: Center(
                                            child: Text(
                                              reciter.name.isNotEmpty ? reciter.name[0] : 'ق',
                                              style: const TextStyle(
                                                color: Color(0xFF00E676),
                                                fontSize: 18,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),

                                  // Floating translucent heart badge
                                  Positioned(
                                    top: -2,
                                    right: -2,
                                    child: GestureDetector(
                                      onTap: () => recitersProvider.toggleFavourite(reciter.id),
                                      child: Container(
                                        width: 22,
                                        height: 22,
                                        decoration: BoxDecoration(
                                          color: Colors.black.withOpacity(0.5),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: Colors.white.withOpacity(0.2),
                                            width: 1,
                                          ),
                                        ),
                                        child: const Icon(
                                          Icons.favorite_rounded,
                                          size: 12,
                                          color: Color(0xFFF43F5E),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),

                              // Display FULL Reciter Name in 2-line wrapped text layout
                              Text(
                                reciter.name, // e.g. "Abdulrahman Al-Suwayid", "Yasser Al-Dosari", "Yussef Al-Suqair"
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                  height: 1.2,
                                  letterSpacing: 0.1,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),

              // 4. Surah Library Header
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Text('Surah Library (114 Surahs)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),

              // 5. Surah List with One-Tap Download Button
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final surah = QuranApiService.allSurahs[index];
                    return SurahListTile(
                      surah: surah,
                      reciter: featuredReciter,
                      onTap: () => audioHandler.playSurah(
                        reciter: featuredReciter,
                        surah: surah,
                        queue: QuranApiService.allSurahs,
                      ),
                    );
                  },
                  childCount: QuranApiService.allSurahs.length,
                ),
              ),

              // Bottom Spacer for Mini Player
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),

          // Pinned Frosted Sticky Mini Player
          const Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: MiniPlayerWidget(),
          ),
        ],
      ),
    );
  }
}
`
  },
  {
    filename: "downloads_screen.dart",
    path: "lib/screens/downloads_screen.dart",
    language: "dart",
    description: "Dedicated Downloads / Offline Library screen: displays all downloaded Surahs, total storage size in MB, Clear All dialog, zero-data offline playback, and delete management.",
    code: `import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/download_service.dart';
import '../services/audio_player_service.dart';
import '../services/quran_api_service.dart';

class DownloadsScreen extends StatelessWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final downloadService = context.watch<DownloadService>();
    final audioHandler = context.watch<QuranAudioHandler>();
    final downloadedItems = downloadService.downloadedItems;

    return Scaffold(
      backgroundColor: const Color(0xFF070B14),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Downloaded Recitations',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              '\${downloadService.totalCount} Surahs • \${downloadService.totalSizeMB} MB',
              style: const TextStyle(fontSize: 11, color: Color(0xFF10B981), fontWeight: FontWeight.w600),
            ),
          ],
        ),
        actions: [
          if (downloadedItems.isNotEmpty)
            TextButton.icon(
              onPressed: () => _confirmClearAll(context, downloadService),
              icon: const Icon(Icons.delete_sweep_rounded, color: Color(0xFFEF4444), size: 18),
              label: const Text(
                'Clear All',
                style: TextStyle(color: Color(0xFFEF4444), fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: downloadedItems.isEmpty
          ? _buildEmptyState(context)
          : ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: downloadedItems.length,
              itemBuilder: (context, index) {
                final item = downloadedItems[index];
                final isCurrent = audioHandler.currentSurah?.number == item.surahNumber &&
                    audioHandler.currentReciter?.id == item.reciterId;
                final isPlaying = isCurrent && audioHandler.player.playing;

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: isCurrent ? const Color(0xFF0F1E2E) : const Color(0xFF0D1525),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isCurrent
                          ? const Color(0xFF10B981).withOpacity(0.5)
                          : Colors.white.withOpacity(0.06),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        // Surah Number circle badge
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isCurrent ? const Color(0xFF10B981) : Colors.white.withOpacity(0.08),
                          ),
                          child: Center(
                            child: Text(
                              item.surahNumber.toString(),
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: isCurrent ? Colors.black : Colors.white,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Reciter Photo Avatar
                        ClipOval(
                          child: CachedNetworkImage(
                            imageUrl: item.reciterPhotoUrl,
                            width: 42,
                            height: 42,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(color: const Color(0xFF1E293B)),
                            errorWidget: (_, __, ___) => Container(
                              color: const Color(0xFF1E293B),
                              child: const Icon(Icons.person, color: Colors.white54, size: 22),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Surah English & Arabic Name, Reciter & File Size
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '\${item.surahNumber}. \${item.surahName} (\${item.arabicName})',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: isCurrent ? const Color(0xFF10B981) : Colors.white,
                                  fontSize: 14,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 3),
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      item.reciterName,
                                      style: const TextStyle(fontSize: 11, color: Colors.white60),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF10B981).withOpacity(0.15),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      '\${item.fileSizeMB} MB',
                                      style: const TextStyle(
                                        color: Color(0xFF10B981),
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'monospace',
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        // Direct Offline Play Button
                        IconButton(
                          iconSize: 34,
                          onPressed: () {
                            final surah = QuranApiService.allSurahs.firstWhere(
                              (s) => s.number == item.surahNumber,
                              orElse: () => QuranApiService.allSurahs.first,
                            );
                            final reciter = Reciter(
                              id: item.reciterId,
                              name: item.reciterName,
                              arabicName: item.reciterName,
                              style: 'Hafs',
                              photoUrl: item.reciterPhotoUrl,
                              serverUrl: 'https://server.mp3quran.net/\${item.reciterId}/',
                              country: 'Global',
                            );
                            // Directly plays offline local file with zero internet connection needed
                            audioHandler.playSurah(
                              reciter: reciter,
                              surah: surah,
                            );
                          },
                          icon: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isPlaying ? const Color(0xFF10B981) : Colors.white.withOpacity(0.08),
                            ),
                            child: Icon(
                              isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                              color: isPlaying ? Colors.black : Colors.white,
                              size: 20,
                            ),
                          ),
                        ),

                        // Delete / Trash Button
                        IconButton(
                          iconSize: 22,
                          icon: const Icon(Icons.delete_outline_rounded, color: Colors.white38),
                          hoverColor: Colors.red.withOpacity(0.1),
                          onPressed: () {
                            _confirmDeleteSingle(context, downloadService, item);
                          },
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF10B981).withOpacity(0.1),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.25), width: 1.5),
              ),
              child: const Icon(
                Icons.download_for_offline_outlined,
                size: 46,
                color: Color(0xFF10B981),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'No downloaded Surahs yet',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            const Text(
              'Download your favourite recitations to listen offline without internet.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.white60, height: 1.4),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.explore_rounded, color: Colors.black, size: 16),
              label: const Text(
                'Explore Surahs',
                style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                shape: const StadiumBorder(),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDeleteSingle(BuildContext context, DownloadService service, DownloadedSurahItem item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F1728),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Delete Download?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        content: Text(
          'Remove \${item.surahName} (by \${item.reciterName}) from your offline library?',
          style: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            onPressed: () {
              service.deleteDownload(item.reciterId, item.surahNumber);
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              shape: const StadiumBorder(),
            ),
            child: const Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _confirmClearAll(BuildContext context, DownloadService service) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F1728),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('Clear All Downloads?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        content: Text(
          'This will remove all \${service.totalCount} downloaded Surahs (\${service.totalSizeMB} MB) from your device.',
          style: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.white60)),
          ),
          ElevatedButton(
            onPressed: () {
              service.clearAllDownloads();
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              shape: const StadiumBorder(),
            ),
            child: const Text('Clear All', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
`
  },
  {
    filename: "playlists_screen.dart",
    path: "lib/screens/playlists_screen.dart",
    language: "dart",
    description: "Playlists & Themes screen: features a prominent top 'Downloaded Recitations' tile leading to the offline library, alongside curated themed reflection categories.",
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/download_service.dart';
import '../services/audio_player_service.dart';
import '../services/quran_api_service.dart';
import 'downloads_screen.dart';

class PlaylistsScreen extends StatelessWidget {
  const PlaylistsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final downloadService = context.watch<DownloadService>();
    final audioHandler = context.watch<QuranAudioHandler>();

    return Scaffold(
      backgroundColor: const Color(0xFF070B14),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Playlists & Themes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
            Text('Curated reflections & offline audio', style: TextStyle(fontSize: 11, color: Colors.white54)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Prominent "Downloads" / "Offline Library" Tile
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const DownloadsScreen()),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F261E), Color(0xFF0E1A29), Color(0xFF070C16)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.35)),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withOpacity(0.12),
                      blurRadius: 16,
                      spreadRadius: 1,
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.18),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                      ),
                      child: const Icon(Icons.download_for_offline_rounded, color: Color(0xFF10B981), size: 26),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Text(
                                'Downloaded Recitations',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981).withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text('Offline', style: TextStyle(color: Color(0xFF10B981), fontSize: 9, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Text(
                            downloadService.totalCount > 0
                                ? '\${downloadService.totalCount} Surahs • \${downloadService.totalSizeMB} MB'
                                : 'No downloaded Surahs yet • Tap to view',
                            style: TextStyle(
                              fontSize: 12,
                              color: downloadService.totalCount > 0 ? const Color(0xFF10B981) : Colors.white54,
                              fontWeight: downloadService.totalCount > 0 ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white54, size: 16),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 2. Curated Collections Title
            const Text(
              'Curated Collections',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),

            // Grid of categories
            _buildCategoryCard(
              context,
              audioHandler,
              title: 'Favourites',
              subtitle: 'Your daily Quran gems',
              surahNumber: 1,
              gradient: const [Color(0xFF2E1F0B), Color(0xFF151922)],
              borderColor: const Color(0xFFF59E0B).withOpacity(0.3),
              icon: Icons.star_rounded,
            ),
            const SizedBox(height: 10),
            _buildCategoryCard(
              context,
              audioHandler,
              title: 'Focus & Work',
              subtitle: 'Deep calm recitations',
              surahNumber: 55,
              gradient: const [Color(0xFF082635), Color(0xFF101928)],
              borderColor: const Color(0xFF06B6D4).withOpacity(0.3),
              icon: Icons.waves_rounded,
            ),
            const SizedBox(height: 10),
            _buildCategoryCard(
              context,
              audioHandler,
              title: 'Sleep Mode',
              subtitle: 'Night serenity recitations',
              surahNumber: 67,
              gradient: const [Color(0xFF18153A), Color(0xFF101428)],
              borderColor: const Color(0xFF6366F1).withOpacity(0.3),
              icon: Icons.nightlight_round,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryCard(
    BuildContext context,
    QuranAudioHandler audioHandler, {
    required String title,
    required String subtitle,
    required int surahNumber,
    required List<Color> gradient,
    required Color borderColor,
    required IconData icon,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: gradient),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: Colors.white, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.white54)),
        trailing: IconButton(
          icon: const Icon(Icons.play_circle_fill_rounded, color: Color(0xFF10B981), size: 30),
          onPressed: () {
            final surah = QuranApiService.allSurahs.firstWhere(
              (s) => s.number == surahNumber,
              orElse: () => QuranApiService.allSurahs.first,
            );
            if (audioHandler.currentReciter != null) {
              audioHandler.playSurah(reciter: audioHandler.currentReciter!, surah: surah);
            }
          },
        ),
      ),
    );
  }
}
`
  },
  {
    filename: "main.dart",
    path: "lib/main.dart",
    language: "dart",
    description: "Application Entry Point: initializes just_audio_background with notification channel, sets up MultiProvider, audio session configuration, and loads first-launch onboarding.",
    code: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'services/audio_player_service.dart';
import 'services/download_service.dart';
import 'services/insights_service.dart';
import 'services/playback_history_service.dart';
import 'providers/reciters_provider.dart';
import 'screens/home_screen.dart';
import 'screens/onboarding_reciters_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Initialize standard Background Audio & Lock Screen Media Controls
  await JustAudioBackground.init(
    androidNotificationChannelId: 'com.alquran.audio.channel.audio',
    androidNotificationChannelName: 'Quran Recitation Playback',
    androidNotificationOngoing: true,
    androidStopForegroundOnPause: true,
    androidNotificationIcon: 'mipmap/ic_launcher',
  );

  // Set system UI navigation and status bar style for AMOLED dark theme
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF070B14),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Check first launch onboarding state
  final prefs = await SharedPreferences.getInstance();
  final isFirstLaunchDone = prefs.getBool(OnboardingRecitersScreen.prefKey) ?? false;

  final audioHandler = QuranAudioHandler();
  final downloadService = DownloadService();
  final recitersProvider = RecitersProvider();
  final insightsService = InsightsService(audioHandler);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<QuranAudioHandler>.value(value: audioHandler),
        ChangeNotifierProvider<PlaybackHistoryService>.value(value: audioHandler.historyService),
        ChangeNotifierProvider<DownloadService>.value(value: downloadService),
        ChangeNotifierProvider<RecitersProvider>.value(value: recitersProvider),
        ChangeNotifierProvider<InsightsService>.value(value: insightsService),
      ],
      child: QuranApp(isFirstLaunchDone: isFirstLaunchDone),
    ),
  );
}

class QuranApp extends StatelessWidget {
  final bool isFirstLaunchDone;

  const QuranApp({super.key, required this.isFirstLaunchDone});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Al-Quran Al-Kareem',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF070B14),
        primaryColor: const Color(0xFF10B981),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF10B981),
          secondary: Color(0xFF38EF7D),
          surface: Color(0xFF0D1525),
        ),
      ),
      home: isFirstLaunchDone ? const HomeScreen() : const OnboardingRecitersScreen(),
    );
  }
}
`
  },
  {
    filename: "pubspec.yaml",
    path: "pubspec.yaml",
    language: "yaml",
    description: "Flutter Dependencies: specifies just_audio, just_audio_background, audio_session, dio, and path_provider for production background audio.",
    code: `name: al_quran_app
description: "Al-Quran Al-Kareem Audio Player with Background Playback & Lock Screen Controls"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # Audio & Background Playback Engine
  just_audio: ^0.9.36
  just_audio_background: ^0.0.1-beta.11
  audio_session: ^0.1.18

  # State Management & Network
  provider: ^6.1.1
  dio: ^5.4.0
  path_provider: ^2.1.2
  cached_network_image: ^3.3.1
  shared_preferences: ^2.2.2
  cupertino_icons: ^1.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`
  },
  {
    filename: "AndroidManifest.xml",
    path: "android/app/src/main/AndroidManifest.xml",
    language: "xml",
    description: "Android Background Audio Configuration: defines WAKE_LOCK, FOREGROUND_SERVICE_MEDIA_PLAYBACK, AudioServiceActivity, AudioService, and MediaButtonReceiver.",
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.alquran.app">

    <!-- Permissions required for background audio playback & lock screen notifications -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.WAKE_LOCK"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"/>

    <application
        android:label="Al-Quran"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher">

        <!-- Activity must inherit from AudioServiceActivity -->
        <activity
            android:name="com.ryanheise.audioservice.AudioServiceActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme"
              />
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>

        <!-- Background Audio Service for Media Playback & Notifications -->
        <service
            android:name="com.ryanheise.audioservice.AudioService"
            android:foregroundServiceType="mediaPlayback"
            android:exported="true">
            <intent-filter>
                <action android:name="android.media.browse.MediaBrowserService" />
            </intent-filter>
        </service>

        <!-- Media button receiver for headset, bluetooth & lock screen action buttons -->
        <receiver
            android:name="com.ryanheise.audioservice.MediaButtonReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MEDIA_BUTTON" />
            </intent-filter>
        </receiver>

        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
`
  },
  {
    filename: "Info.plist",
    path: "ios/Runner/Info.plist",
    language: "xml",
    description: "iOS Background Audio Configuration: sets UIBackgroundModes to audio for lock screen and Control Center media playback.",
    code: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDevelopmentRegion</key>
	<string>$(DEVELOPMENT_LANGUAGE)</string>
	<key>CFBundleDisplayName</key>
	<string>Al-Quran</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>al_quran_app</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>$(FLUTTER_BUILD_NAME)</string>
	<key>CFBundleVersion</key>
	<string>$(FLUTTER_BUILD_NUMBER)</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>

	<!-- Enable Background Audio Playback for Control Center & Lock Screen -->
	<key>UIBackgroundModes</key>
	<array>
		<string>audio</string>
	</array>

	<key>UILaunchStoryboardName</key>
	<string>LaunchScreen</string>
	<key>UIMainStoryboardFile</key>
	<string>Main</string>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
	</array>
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<false/>
</dict>
</plist>
`
  },
  {
    filename: "playback_history_service.dart",
    path: "lib/services/playback_history_service.dart",
    language: "dart",
    description: "Playback History & Auto-Resume Engine: persists last listened Surah, Reciter, and exact seconds position periodically (every 5s), on pause/stop, and on app lifecycle changes using SharedPreferences.",
    code: `import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PlaybackHistoryItem {
  final int surahNumber;
  final String surahName;
  final String arabicName;
  final String reciterId;
  final String reciterName;
  final String reciterPhoto;
  final int positionSeconds;
  final int totalDurationSeconds;
  final DateTime updatedAt;

  PlaybackHistoryItem({
    required this.surahNumber,
    required this.surahName,
    required this.arabicName,
    required this.reciterId,
    required this.reciterName,
    required this.reciterPhoto,
    required this.positionSeconds,
    required this.totalDurationSeconds,
    required this.updatedAt,
  });

  String get formattedPosition {
    final m = (positionSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (positionSeconds % 60).toString().padLeft(2, '0');
    return '\$m:\$s';
  }

  String get formattedDuration {
    final m = (totalDurationSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (totalDurationSeconds % 60).toString().padLeft(2, '0');
    return '\$m:\$s';
  }

  double get progressRatio => totalDurationSeconds > 0
      ? (positionSeconds / totalDurationSeconds).clamp(0.0, 1.0)
      : 0.0;

  int get progressPercent => (progressRatio * 100).toInt();

  Map<String, dynamic> toJson() => {
    'last_surah_number': surahNumber,
    'last_surah_name': surahName,
    'arabic_name': arabicName,
    'last_reciter_id': reciterId,
    'last_reciter_name': reciterName,
    'last_reciter_photo': reciterPhoto,
    'last_position_seconds': positionSeconds,
    'last_total_duration_seconds': totalDurationSeconds,
    'updated_at': updatedAt.toIso8601String(),
  };

  factory PlaybackHistoryItem.fromJson(Map<String, dynamic> json) => PlaybackHistoryItem(
    surahNumber: json['last_surah_number'] ?? 1,
    surahName: json['last_surah_name'] ?? 'Al-Fatihah',
    arabicName: json['arabic_name'] ?? 'الفاتحة',
    reciterId: json['last_reciter_id'] ?? 'yasser',
    reciterName: json['last_reciter_name'] ?? 'Yasser Al-Dosari',
    reciterPhoto: json['last_reciter_photo'] ?? '',
    positionSeconds: json['last_position_seconds'] ?? 0,
    totalDurationSeconds: json['last_total_duration_seconds'] ?? 0,
    updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : DateTime.now(),
  );
}

class PlaybackHistoryService extends ChangeNotifier {
  static const String _key = 'quran_last_playback_state_v1';
  PlaybackHistoryItem? _lastItem;
  bool _isLoaded = false;

  PlaybackHistoryItem? get lastPlayback => _lastItem;
  bool get hasLastPlayback => _lastItem != null && _lastItem!.positionSeconds > 0;
  bool get isLoaded => _isLoaded;

  PlaybackHistoryService() {
    loadLastPlayback();
  }

  Future<PlaybackHistoryItem?> loadLastPlayback() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw != null) {
        _lastItem = PlaybackHistoryItem.fromJson(jsonDecode(raw));
      }
    } catch (e) {
      debugPrint('Error loading playback history: \$e');
    }
    _isLoaded = true;
    notifyListeners();
    return _lastItem;
  }

  Future<void> savePlayback({
    required int surahNumber,
    required String surahName,
    required String arabicName,
    required String reciterId,
    required String reciterName,
    required String reciterPhoto,
    required int positionSeconds,
    required int totalDurationSeconds,
  }) async {
    if (positionSeconds < 0) return;

    _lastItem = PlaybackHistoryItem(
      surahNumber: surahNumber,
      surahName: surahName,
      arabicName: arabicName,
      reciterId: reciterId,
      reciterName: reciterName,
      reciterPhoto: reciterPhoto,
      positionSeconds: positionSeconds,
      totalDurationSeconds: totalDurationSeconds,
      updatedAt: DateTime.now(),
    );

    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, jsonEncode(_lastItem!.toJson()));
    } catch (e) {
      debugPrint('Error saving playback history: \$e');
    }
  }

  Future<void> clearHistory() async {
    _lastItem = null;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
`
  }
];


