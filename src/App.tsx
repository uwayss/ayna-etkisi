import { useState, useEffect, useRef } from "react";
import "./App.css";

// Turkish UI Strings
const UI_STRINGS = {
  title: "Ayna Ayna Söyle Bana",
  realYouButton: "Başkaları Seni Nasıl Görüyor (Gerçek Sen)",
  mirrorYouButton: "Kendini Nasıl Görüyorsun (Aynadaki Sen)",
  explanationHeader: "Neden Farklı Görünüyor?",
  explanationText1: `Çoğu video konferans uygulaması ve telefonun ön kamerası, görüntünü sana bir ayna gibi (yatayda ters çevrilmiş) gösterir. Bu, normalde aynada gördüğün yansımadır ve kendini daha rahat hissetmeni sağlar.`,
  explanationText2: `"Başkaları Seni Nasıl Görüyor" seçeneği, insanların seni gerçek hayatta gördüğü gibi, yani ters çevrilmemiş halini gösterir. Yüzümüzdeki küçük asimetriler nedeniyle bu görüntü ilk başta biraz garip gelebilir. Ama unutma, herkesin yüzü az ya da çok asimetriktir ve insanlar seni bu "gerçek" halinle tanır ve sever! :) Bu sadece bir algı meselesi.`,
  cameraError:
    "Kamera erişimi reddedildi veya bir hata oluştu. Lütfen tarayıcı ayarlarından izinleri kontrol et.",
  cameraLoading: "Kamera yükleniyor, lütfen bekle...",
  permissionPrompt: "Kameranı kullanmak için iznine ihtiyacımız var.",
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true); // Start with mirror view (how you see yourself)
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true to show loading

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
          video: {
            // Optional: You can try to force front camera on mobile
            // facingMode: "user" // 'user' for front, 'environment' for back
          },
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

    // Cleanup function to stop the stream when component unmounts
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  const handleShowRealYou = () => {
    setIsMirrored(false); // Real you is not mirrored (flipped from default cam view)
  };

  const handleShowMirrorYou = () => {
    setIsMirrored(true); // Mirror you is mirrored (default cam view)
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
          playsInline // Important for iOS
          muted // Often necessary for autoplay, also you don't need sound
          style={{
            transform: isMirrored ? "scaleX(-1)" : "scaleX(1)",
          }}
        />
      </div>

      {stream && !error && (
        <div className="controls">
          <button
            onClick={handleShowRealYou}
            className={!isMirrored ? "active" : ""}
          >
            {UI_STRINGS.realYouButton}
          </button>
          <button
            onClick={handleShowMirrorYou}
            className={isMirrored ? "active" : ""}
          >
            {UI_STRINGS.mirrorYouButton}
          </button>
        </div>
      )}

      {!isLoading && ( // Show explanation once loading is done
        <div className="explanation">
          <h3>{UI_STRINGS.explanationHeader}</h3>
          <p>{UI_STRINGS.explanationText1}</p>
          <p>{UI_STRINGS.explanationText2}</p>
        </div>
      )}
    </div>
  );
}

export default App;
