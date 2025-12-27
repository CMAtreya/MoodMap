import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

export default function EmotionDetector({ onDetected, onClose }) {
    const videoRef = useRef();
    const canvasRef = useRef();
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                // Use a reliable CDN for models
                const MODEL_URL = 'https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js@0.22.2/weights';
                console.log("Loading models from:", MODEL_URL);

                // Initialize TensorFlow backend explicitly
                await faceapi.tf.setBackend('webgl');
                // await faceapi.tf.ready(); // Removed as it's not supported in this version

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
                ]);
                console.log("Models loaded successfully");
                startVideo();
            } catch (err) {
                console.error("Failed to load models", err);
                setError("Could not load AI models. Please check console for details.");
                setInitializing(false);
            }
        };
        loadModels();
    }, []);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                // Don't set initializing false here, wait for video to play
            })
            .catch(err => {
                console.error("Camera error:", err);
                setError("Camera access denied or device not found.");
                setInitializing(false);
            });
    };

    const handleSchema = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Match dimensions
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        // Detect once - usually for "Snap" style
        // For continuous, we would use an interval, but user requested "Scan"
        try {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            // Clear previous draw
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

            if (detections.length > 0) {
                const expressions = detections[0].expressions;
                const dominant = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);

                // Small delay to let user see the box
                setTimeout(() => {
                    // Stop stream
                    const stream = video.srcObject;
                    if (stream) stream.getTracks().forEach(t => t.stop());
                    onDetected(dominant, expressions);
                }, 1000);
            } else {
                alert("No face detected. Please ensure good lighting and face the camera.");
            }
        } catch (e) {
            console.error("Detection error:", e);
        }
    };

    const handleVideoPlay = () => {
        setInitializing(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold text-center mb-4 text-slate-800">Vibe Check</h2>

                {error ? (
                    <div className="text-red-500 text-center py-8 bg-red-50 rounded-lg border border-red-100 p-4">
                        <p className="font-bold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                ) : (
                    <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video mb-6">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            onPlay={handleVideoPlay}
                            className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="absolute inset-0 z-10" />

                        {initializing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white gap-2 z-20">
                                <Loader2 className="animate-spin" /> Loading AI...
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-center">
                    <Button
                        onClick={handleSchema}
                        disabled={initializing || error}
                        className="rounded-full px-8 h-12 text-lg bg-indigo-600 hover:bg-indigo-700 w-full"
                    >
                        <Camera className="mr-2" />
                        {initializing ? 'Initializing...' : 'Capture Mood'}
                    </Button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                    Analyzes facial expressions locally in your browser.
                </p>
            </div>
        </div>
    );
}
