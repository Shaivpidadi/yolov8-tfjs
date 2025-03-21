import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // set backend to webgl
import Loader from "./components/loader";
import ButtonHandler from "./components/btn-handler";
import { detect, detectVideo } from "./utils/detect";
import "./style/App.css";

const App = () => {
  const [selectedModel, setSelectedModel] = useState(""); // selected model
  const [loading, setLoading] = useState({ loading: true, progress: 0 }); // loading state
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  }); // init model & input shape

  // references
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if(!selectedModel) return 
    tf.ready().then(async () => {
      const yolov8 = await tf.loadGraphModel(
        `${window.location.href}/${selectedModel}_web_model/model.json`,
        {
          onProgress: (fractions) => {
            setLoading({ loading: true, progress: fractions }); // set loading fractions
          },
        }
      ); // load model

      // warming up model
      const dummyInput = tf.ones(yolov8.inputs[0].shape);
      const warmupResults = yolov8.execute(dummyInput);

      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov8,
        inputShape: yolov8.inputs[0].shape,
      }); // set model & input shape

      tf.dispose([warmupResults, dummyInput]); // cleanup memory
    });
  }, [selectedModel]);

  return (

    <>
      {!selectedModel ? (
        <div className="App">
          <select onChange={(e) => setSelectedModel(e.target.value)}>
            <option value="">Select Model</option>
            <option value="yolov8n">Object Detection</option>
            <option value="warehouse">Warehouse Detection</option>
          </select>
        </div>
      ) : (
        <div className="App">
          {loading.loading && <Loader>Loading model... {(loading.progress * 100).toFixed(2)}%</Loader>}
          <div className="header">
            <h1>📷 Live Detection App</h1>
            <p>
              Serving : <code className="code">{selectedModel}</code>
            </p>
          </div>

          <div className="content">
            <img
              src="#"
              ref={imageRef}
              onLoad={() => detect(imageRef.current, model, canvasRef.current, selectedModel)}
            />
            <video
              autoPlay
              muted
              ref={cameraRef}
              onPlay={() => detectVideo(cameraRef.current, model, canvasRef.current, selectedModel)}
            />
            <video
              autoPlay
              muted
              ref={videoRef}
              onPlay={() => detectVideo(videoRef.current, model, canvasRef.current, selectedModel)}
            />
            <canvas width={model.inputShape[1]} height={model.inputShape[2]} ref={canvasRef} />
          </div>

          <ButtonHandler imageRef={imageRef} cameraRef={cameraRef} videoRef={videoRef} resetModel={() => setSelectedModel("")}/>
        </div>
      )}
    </>
  )
};

export default App;
