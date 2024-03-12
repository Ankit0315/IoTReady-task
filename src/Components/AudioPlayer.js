import React, { useState, useEffect, useRef } from "react";
import Dexie from "dexie";
import './design.css';

const AudioPlayer = () => {
    const [uploadedFile, setUploadedFile] = useState({
        file: null,
        success: false
    });
    const [playlist, setPlaylist] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const db = new Dexie('audioDatabase');
    db.version(1).stores({
        songs: "++id, name, song"
    });

    const resetDB = () => {
        db.delete();
        window.location.reload(false);
    };

    const onFileChange = (event) => {
        setUploadedFile({ file: event.target.files[0], success: false });
    };

    const getSongs = async () => {
        try {
            const res = await db.songs.toArray();
            if (res.length > 0) {
                setPlaylist(res);
            }
        } catch (e) {
            console.log(e);
        }
    };
    const startPlayback = () => {
      if (audioRef.current) {
         
          if (audioRef.current.readyState < 3) {
             
              audioRef.current.addEventListener('canplay', () => {
                  audioRef.current.play().then(() => {
                      setIsPlaying(true);
                  }).catch((error) => {
                      console.error('Error during playback initiation:', error);
                  });
              }, { once: true });
          } else {
             
              audioRef.current.play().then(() => {
                  setIsPlaying(true);
              }).catch((error) => {
                  console.error('Error during playback initiation:', error);
              });
          }
      }
  };


  const handleSrcChange = (newSrc) => {

    if (audioRef.current) {
        audioRef.current.pause();
    }

    if (audioRef.current) {
        audioRef.current.src = newSrc;
    }

  
    if (isPlaying) {
        startPlayback();
    }
};
    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const onFileUpload = async () => {
        try {
            const base64Song = await getBase64(uploadedFile.file);
            const newSong = { name: uploadedFile.file.name, song: base64Song };
            const addedSong = await db.songs.add(newSong);
            setUploadedFile({ ...uploadedFile, success: true });
            setPlaylist([...playlist, { ...newSong, id: addedSong }]);
        } catch (e) {
            alert(`Upload Unsuccessful. Error: ${e}`);
        }
    };

    const playNextTrack = () => {
        setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    };

    const handleTimeUpdate = () => {
        sessionStorage.setItem('currentTime', audioRef.current.currentTime);
    };

    const handleEnded = () => {
        playNextTrack();
    };

    useEffect(() => {
        getSongs();
    }, []);

    useEffect(() => {
        const savedTime = sessionStorage.getItem('currentTime');
        if (savedTime !== null) {
            audioRef.current.currentTime = parseFloat(savedTime);
        }
    }, [currentTrackIndex]);

    useEffect(() => {
        if (uploadedFile.success) {
            playNextTrack();
        }
    }, [uploadedFile.success]);

    useEffect(() => {
        const currentTrack = playlist[currentTrackIndex];
        if (currentTrack) {
            localStorage.setItem('currentTrackId', currentTrack.id);
            audioRef.current.src = currentTrack.song;
            // audioRef.current.play();
            setIsPlaying(true);
        }
    }, [currentTrackIndex, playlist]);

    return (
        <div className="container">
            <div className="card">
                <div className="upload-section">
                    <h1>Choose File and then click on Upload and wait for a few seconds</h1>
                    <input type="file" name="song" id="song" accept="audio/*"  onChange={onFileChange} />
                    <button onClick={onFileUpload}>Upload</button>
                </div>
                <div className="playlist-section">
                    <h3>Playlist</h3>
                    <ul>
                        {playlist.map((item, index) => (
                            <li key={item.id} onClick={() => setCurrentTrackIndex(index)}>
                                {item.name}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="play-section">
                    <h3>Now Playing</h3>
                    {playlist.length > 0 && (
                        <p>{playlist[currentTrackIndex].name}</p>
                    )}
                    <audio
                        ref={audioRef}
                        controls
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                    />
                    <button onClick={resetDB}>Reset</button>
                    
                    <button onClick={() => handleSrcChange('new-audio-source.mp3')}>
                        Change Source
                    </button>
                
                    <button onClick={playNextTrack}>Next Track</button>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
