import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function useAttention(active) {

  const videoRef = useRef(null);
  const [attention, setAttention] = useState(7);

  useEffect(() => {
    if (!active) return;

    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      startVideo();
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          videoRef.current.srcObject = stream;
        });
    };

    loadModels();
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(async () => {
      if (!videoRef.current) return;

      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      if (!detection) {
        setAttention(prev => Math.max(prev - 1, 0));
        return;
      }

      const nose = detection.landmarks.getNose()[3];
      const faceCenter = detection.detection.box.x + detection.detection.box.width / 2;

      const offset = Math.abs(nose.x - faceCenter);

      if (offset > 30) {
        setAttention(prev => Math.max(prev - 1, 0));
      } else {
        setAttention(prev => Math.min(prev + 1, 10));
      }

    }, 1000);

    return () => clearInterval(interval);

  }, [active]);

  return { videoRef, attention };
}