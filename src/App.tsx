import { useState, useEffect, useRef } from "react";
import "./App.css";

const UI_STRINGS = {
  title: "Görünüş Deneyi",
  realYouButton: "Herkes Seni Nasıl Görüyor",
  mirrorYouButton: "Kendini Nasıl Görüyorsun",
  cameraError:
    "Kamera erişimi reddedildi veya bir hata oluştu. Lütfen tarayıcı ayarlarından izinleri kontrol et.",
  cameraLoading: "Kamera yükleniyor, lütfen bekle...",
  permissionPrompt: "Kameranı kullanmak için iznine ihtiyacımız var.",
};

const FADE_DURATION_MS = 250;
const BUTTON_COOLDOWN_MS = 1500;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMirroredViewActive, setIsMirroredViewActive] =
    useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);
  const [videoOpacity, setVideoOpacity] = useState<number>(1);

  useEffect(() => {
    let currentStream: MediaStream;

    const getCameraAccess = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Tarayıcın kamera erişimini desteklemiyor.");
          setIsLoading(false);
          return;
        }
        currentStream = await navigator.mediaDevices.getUserMedia({
          video: {},
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
      } catch (err) {
        console.error("Kamera erişimi hatası:", err);
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setError(UI_STRINGS.cameraError + " İzin vermeniz gerekiyor.");
        } else if (
          err instanceof DOMException &&
          err.name === "NotFoundError"
        ) {
          setError(
            "Kamera bulunamadı. Lütfen bir kamera bağlı olduğundan emin olun."
          );
        } else {
          setError(UI_STRINGS.cameraError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    getCameraAccess();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleViewChange = (showMirrorView: boolean) => {
    if (isButtonDisabled) {
      return;
    }

    setIsButtonDisabled(true);
    setVideoOpacity(0);

    setTimeout(() => {
      setIsMirroredViewActive(showMirrorView);
      setVideoOpacity(1);
    }, FADE_DURATION_MS);

    setTimeout(() => {
      setIsButtonDisabled(false);
    }, BUTTON_COOLDOWN_MS);
  };

  return (
    <div className="container">
      <h1>{UI_STRINGS.title}</h1>

      {isLoading && (
        <p className="loading-message">{UI_STRINGS.cameraLoading}</p>
      )}
      {error && <p className="error-message">{error}</p>}

      {!isLoading && !error && !stream && (
        <p className="permission-prompt">{UI_STRINGS.permissionPrompt}</p>
      )}

      <div
        className="video-wrapper"
        style={{ display: stream && !error ? "block" : "none" }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            transform: isMirroredViewActive ? "scaleX(-1)" : "scaleX(1)",
            opacity: videoOpacity,
          }}
        />
      </div>

      {stream && !error && (
        <div className="controls">
          <button
            onClick={() => handleViewChange(false)}
            className={!isMirroredViewActive ? "active" : ""}
            disabled={isButtonDisabled}
          >
            {UI_STRINGS.realYouButton}
          </button>
          <button
            onClick={() => handleViewChange(true)}
            className={isMirroredViewActive ? "active" : ""}
            disabled={isButtonDisabled}
          >
            {UI_STRINGS.mirrorYouButton}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
