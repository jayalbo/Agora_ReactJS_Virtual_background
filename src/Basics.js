import VirtualBackgroundExtension from "agora-extension-virtual-background";

import {
  LocalUser,
  RemoteUser,
  LocalVideoTrack,
  useIsConnected,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import AgoraRTC from "agora-rtc-sdk-ng";
import React, { useState } from "react";
import "./App.css";
let processor = null;

export const Basics = () => {
  const appId = "YOUR_APP_ID";
  const [calling, setCalling] = useState(false);
  const [channel, setChannel] = useState("");
  const [token, setToken] = useState("");
  const isConnected = useIsConnected();
  const [mirror, setMirror] = useState(true);

  // Join the channel
  useJoin(
    {
      appid: appId,
      channel: channel,
      token: token ? token : null,
    },
    calling,
  );

  // Local
  const [micOn, setMic] = useState(true);
  const [virtualBg, setVirtualBg] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const { ready: isLoadingMic, localMicrophoneTrack } =
    useLocalMicrophoneTrack(micOn);
  const { ready: isLoadingCam, localCameraTrack } =
    useLocalCameraTrack(cameraOn);
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Remote users
  const remoteUsers = useRemoteUsers();
  const handleVBChange = (e) => {
    switch (e.target.value) {
      case "Color":
        processor.setOptions({ type: "color", color: "#00FF00" });
        break;
      case "Image":
        const imageElement = new Image();

        imageElement.src = "/1654571689670.png";
        imageElement.onload = () => {
          processor.setOptions({ type: "img", source: imageElement });
        };
        break;
      case "Blur":
        processor.setOptions({ type: "blur", blurDegree: 1 });
        break;
      default:
        processor.setOptions({ type: "none" });
        break;
    }
  };
  const handleToggleMic = () => {
    setMic(!micOn);
  };
  const handleToggleCamera = () => {
    setCameraOn(!cameraOn);
  };
  const handleLeaveCall = () => {
    setCalling(false);
  };
  const handleVirtualBackground = async () => {
    if (!virtualBg) {
      // Initialize virtual background processor
      if (!processor) {
        processor = extension.createProcessor();
        await processor.init();
      }
      localCameraTrack
        .pipe(processor)
        .pipe(localCameraTrack.processorDestination);

      await processor.enable();
      processor.setOptions({ type: "blur", blurDegree: 1 });
      setVirtualBg(true);
      console.log("Initializing virtual background processor...");
    } else {
      console.log(processor);
      processor.unpipe();
      localCameraTrack.unpipe(processor);

      setVirtualBg(false);

      console.log("Disabling virtual background processor...");
    }
  };

  const deviceLoading = isLoadingCam || isLoadingMic;

  // Virtual Background
  const extension = new VirtualBackgroundExtension();
  AgoraRTC.registerExtensions([extension]);

  if (deviceLoading) {
    return <div>Loading Devices...</div>;
  }

  return (
    <>
      {!isConnected && (
        <div className="room">
          <div className="join-room">
            <input
              onChange={(e) => setToken(e.target.value)}
              placeholder="Token (optional)"
              value={token}
            />
            <input
              onChange={(e) => setChannel(e.target.value)}
              placeholder="Channel"
              value={channel}
            />
            <button onClick={() => setCalling(true)}>Join</button>
          </div>
        </div>
      )}
      {isConnected && (
        <div className="local">
          <LocalUser
            cameraOn={cameraOn}
            micOn={micOn}
            playAudio={false}
            playVideo={false}
            videoTrack={localCameraTrack}
            audioTrack={localMicrophoneTrack}
          >
            <LocalVideoTrack
              track={localCameraTrack}
              play={true}
              videoPlayerConfig={{ mirror }}
            />
          </LocalUser>

          <div className="controls">
            <button onClick={handleToggleMic}>
              {micOn ? "Turn Mic Off" : "Turn Mic On"}
            </button>
            <button onClick={handleToggleCamera}>
              {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
            </button>
            <button onClick={() => setMirror(!mirror)}>
              {mirror ? "Mirror Off" : "Mirror On"}
            </button>
            <button onClick={handleLeaveCall}>Leave Call</button>
            <button onClick={handleVirtualBackground}>
              {virtualBg
                ? "Disable Virtual Background"
                : "Enable Virtual Background"}
            </button>
            {virtualBg && (
              <select id="bg-select" onChange={handleVBChange}>
                <option value="Blur">Blur</option>
                <option value="Color">Color</option>
                <option value="Image">Image</option>
                <option value="None">None</option>
              </select>
            )}
          </div>
          <div className="remote">
            {remoteUsers.map((user) => (
              <RemoteUser user={user}></RemoteUser>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
