import React, { useEffect, useState, useRef } from "react";
import "./stringee_sdk.css";
const stringeeClient = new window.StringeeClient();

const StringeeSDK = () => {
    const remoteVideo = useRef(null);
    const localTrack = useRef(null);
    const remoteTrack = useRef(null);
    const [isOnCall, setOnCall] = useState(false);
    const [isAuthenticated, setAuthenticate] = useState(false);
    const [incomingCaller, setIncomingCaller] = useState("");
    const [isIncomingCall, setIncomingCall] = useState(false);
    const [inputClientToken, setInputClientToken] = useState("eyJjdHkiOiJzdHJpbmdlZS1hcGk7dj0xIiwidHlwIjoiSldUIiwiYWxnIjoiSFMyNTYifQ.eyJqdGkiOiJTSy4wLmwxRG1qQnFQeUZ0M1h4Nnh5R3A2Q0NGdlZhbHJlbzctMTcxNzE3NTQ5OCIsImlzcyI6IlNLLjAubDFEbWpCcVB5RnQzWHg2eHlHcDZDQ0Z2VmFscmVvNyIsImV4cCI6MTcxOTc2NzQ5OCwidXNlcklkIjoiMTExIiwiaWNjX2FwaSI6dHJ1ZX0.H2xH2RhRUT2MmpICPhwdoKRkBsUsKkzw7xLEA6VKJu0");
    const [inputHotline, setInputHotline] = useState("842871020497");
    const [inputCallee, setInputCallee] = useState("84369699871");
    const [stringeeCall, setStringeeCall] = useState(null);
    const [callStatus, setCallStatus] = useState("");
    const [userId, setUserId] = useState("");
    const [callType, setCallType] = useState("");

    useEffect(() => {
        settingClientEvents(stringeeClient);
    }, []);

    const settingClientEvents = client => {
        client.on("connect", () => {
            console.log("Connected to Stringee server");
        });
        client.on("disconnect", () => {
            setUserId("");
            setAuthenticate(false);
            console.log("Disconnected to Stringee server");
        });
        client.on("authen", (res) => {
            console.log("Authen: ", res);
            if (res.r === 0) {
                setAuthenticate(true);
                setUserId(res.userId);
            } else {
                alert(res.msg);
                stringeeClient.disconnect();
            }
        });
        client.on("incomingcall", (incomingcall) => {
            setIncomingCall(true);
            setStringeeCall(incomingcall);
            console.log("Incoming call: ", incomingcall);
            setUIIncomingCall(incomingcall);
            settingCallEvents(incomingcall);
        });
        client.on("incomingcall2", (incomingcall2) => {
            setIncomingCall(true);
            setStringeeCall(incomingcall2);
            console.log("Incoming call 2: ", incomingcall2);
            setUIIncomingCall(incomingcall2);
            settingCallEvents(incomingcall2);
        });
        client.on("requestnewtoken", () => {
            console.log("Token expire, please re-connect!");
        });
        client.on("otherdeviceauthen", res => {
            console.log("Another device is connected by same userId: ", res);
        });
        client.on("custommessage", (res) => {
            console.log(res);
        });
        client.on("messagefromtopic", (data) => {
            console.log("Message from topic", data);
        });
    };

    const settingCallEvents = call => {
        call.on("error", info => {
            console.log("Error: ", info);
        });
        call.on("addlocalstream", stream => {
            console.log("Add local stream: ", stream);
        });
        if (call.isVideoCall === true) {
            call.on("addlocaltrack", localtrack => {
                console.log("Add local track: ", localtrack);
                let element = localtrack.attach();
                element.style.height = "100%";
                element.style.width = "100%";
                localTrack.current.appendChild(element);
            });
            call.on("addremotetrack", remotetrack => {
                console.log("Add remote track: ", remotetrack);
                var element = remotetrack.attach();
                element.style.height = "100%";
                element.style.width = "100%";
                remoteTrack.current.appendChild(element);
            });
            call.on("removeremotetrack", track => {
                track.detachAndRemove();
            });
            call.on("removelocaltrack", track => {
                track.detachAndRemove();
            });
        } else {
            call.on("addremotestream", (stream) => {
                console.log("Add remote stream: ", stream);
                remoteVideo.current.srcObject = null;
                remoteVideo.current.srcObject = stream;
            });
        }
        call.on("signalingstate", state => {
            console.log("Signalingstate: ", state);
            if (state.code === 6) {
                callEnd();
            }
            if (state.code === 5) {
                callEnd();
            }
            setCallStatus(state.reason);
        });
        call.on("mediastate", state => {
            console.log("Mediastate: ", state);
        });
        call.on("info", info => {
            console.log("Info: ", info);
        });
        call.on("otherdevice", data => {
            console.log("Otherdevice: ", data);
            if ((data.type === "CALL_STATE" && data.code >= 200) || data.type === "CALL_END" || (data.type === "CALL2_STATE" && data.code >= 200)) {
                callEnd();
            }
        });
    }

    const callEnd = () => {
        remoteVideo.current.srcObject = null;
        setOnCall(false);
        setIncomingCall(false);
    };

    const setUIIncomingCall = call => {
        if (call.fromInternal) {
            setCallType("App to app");
        } else {
            setCallType("Phone to app");
        }
        setIncomingCaller(call.fromNumber);
    }

    const onChangeClientToken = (e) => {
        setInputClientToken(e.target.value);
    };

    const onChangeHotline = (e) => {
        setInputHotline(e.target.value);
    };

    const onChangeCallee = (e) => {
        setInputCallee(e.target.value);
    };

    const connect = () => {
        stringeeClient.connect(inputClientToken);
    };

    const disconnect = () => {
        stringeeClient.disconnect();
    };

    const makeVoiceCall = () => {
        makeCall("gsm");
    };

    const makeInternalCall = () => {
        makeCall("free");
    };

    const makeVideoCall = () => {
        makeCall("voice");
    };

    const makeCall = type => {
        let call;
        switch (type) {
            case "gsm":
                if (!inputHotline || !inputCallee) throw alert("Please enter hotline and callee");
                call = new window.StringeeCall(stringeeClient, inputHotline, inputCallee, false);
                break;
            case "free":
                if (!inputCallee) throw alert("Please enter hotline and callee");
                call = new window.StringeeCall(stringeeClient, userId, inputCallee, false);
                break;
            case "voice":
                if (!inputCallee) throw alert("Please enter hotline and callee");
                call = new window.StringeeCall2(stringeeClient, userId, inputCallee, true);
                break;
            default:
                break;
        }
        setStringeeCall(call);
        settingCallEvents(call);
        setOnCall(true);
        call.makeCall((res) => {
            console.log("Make call: ", res);
            if (res.r !== 0) {
                setCallStatus(res.message);
            }
            else {
                if (res.toType === "internal") {
                    setCallType("App to app");
                } else {
                    setCallType("App to phone");
                }
            }
        });
    };

    const hangup = () => {
        callEnd();
        stringeeCall.hangup((res) => {
            setCallStatus("Ended");
            console.log("Hang up: ", res);
        });
    };

    const answer = () => {
        setIncomingCall(false);
        stringeeCall.answer(res => {
            setOnCall(true);
            setCallStatus("Answered");
            console.log("Answer call: ", res);
        });
    };

    const reject = () => {
        setIncomingCall(false);
        stringeeCall.reject(res => {
            setOnCall(false);
            setCallStatus("Ended");
            console.log("Reject call: ", res);
        });
    };

    return (
        <div className="sdk-page flex-row">
            <div className="setup-area flex-column">
                <div className="connect-area flex-row">
                    <textarea cols="30" rows="10" placeholder="Enter client token" disabled={isAuthenticated} value={inputClientToken} onChange={onChangeClientToken} ></textarea>
                    <div className="flex-column">
                        <button disabled={isAuthenticated} onClick={connect} >CONNECT</button>
                        <button disabled={!isAuthenticated} onClick={disconnect} >DISCONNECT</button>
                    </div>
                </div>
                <p className="client-status">{userId} {isAuthenticated ? "is connected" : "Not connected"}</p>
                <input type="text" className="input-hotline-callee" disabled={!isAuthenticated} placeholder="Enter hotline" value={inputHotline} onChange={onChangeHotline} />
                <input type="text" className="input-hotline-callee" disabled={!isAuthenticated} placeholder="Enter callee" value={inputCallee} onChange={onChangeCallee} />
                <p>Call status: {callStatus}</p>
                <p>Call type: {callType}</p>
                <div className="action-area flex-row">
                    <button className="action-btn" disabled={!isAuthenticated || isOnCall} onClick={makeVoiceCall}>Voice call</button>
                    <button className="action-btn" disabled={!isAuthenticated || isOnCall} onClick={makeInternalCall}>Internal call</button>
                    <button className="action-btn" disabled={!isAuthenticated || isOnCall} onClick={makeVideoCall}>Video call</button>
                    <button className="action-btn" disabled={!isAuthenticated || !isOnCall} onClick={hangup}>Hang up</button>
                </div>
                {
                    isIncomingCall && (
                        <div className="incoming-call-area flex-column">
                            <p>Incoming call from {incomingCaller}</p>
                            <div className="flex-row">
                                <button className="action-btn" onClick={answer}>Answer</button>
                                <button className="action-btn" onClick={reject}>Reject</button>
                            </div>
                        </div>
                    )
                }
                <video ref={remoteVideo} autoPlay playsInline ></video >
            </div>
            <div className="video-area">
                <div ref={remoteTrack} id="remoteVideo">
                    <div ref={localTrack} id="localVideo"></div>
                </div>
            </div>
        </div>
    )
}

export default StringeeSDK;