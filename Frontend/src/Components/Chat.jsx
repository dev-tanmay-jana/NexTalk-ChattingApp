import React, { useEffect,useContext,useRef,useState } from 'react'
import { formatMessgaeTime } from '../Lib/Utils';
import { ChatContext } from '../Context/ChatContext';
import { AuthContext } from '../Context/AuthContext';
import { MdOutlineVideoCall, MdAddCall, MdMic, MdMicOff } from "react-icons/md";
import toast from 'react-hot-toast';
import assets from '../assets/assets.js';

const Chat = () => {
    const { messages,selectedUser,setSelectedUser,sendMessage,getMessage } = useContext(ChatContext);

    const { authUser,onlineUsers,socket } = useContext(AuthContext);

    // WebRTC state
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const pcRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [inCall, setInCall] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [muted, setMuted] = useState(false);

    const scrollEnd = useRef();

    const [input,setInput] = useState('');
    const handleSendMessgae = async(e)=>{
        e.preventDefault();
        if(input.trim() === '' )return null;
        await sendMessage({text: input.trim()});
        setInput("");
    }
    // handel sendin an image
    const handleSendImage =async(e) =>{
        const file = e.target.files && e.target.files[0];
        if(!file || !file.type.startsWith("image/")){
            toast.error("Select an image");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = async ()=>{
            await sendMessage({image: reader.result});
            e.target.value = "";
        }
        reader.readAsDataURL(file);
    }
    useEffect(()=>{
        if(selectedUser){
            getMessage(selectedUser._id)
        }
    },[selectedUser])

    // Socket listeners for call signaling
    useEffect(() => {
        if (!socket) return;

        const handleIncomingCall = ({ from, offer }) => {
            setIncomingCall({ from, offer });
        };

        const handleCallAnswered = async ({ from, answer }) => {
            try {
                if (pcRef.current) {
                    console.log('Setting remote description (answer) from:', from);
                    await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('Remote description set successfully');
                } else {
                    console.error('No peer connection available for answer');
                }
            } catch (err) {
                console.error('Error setting remote description (answer):', err.name, err.message);
            }
        };

        const handleRemoteIce = async ({ from, candidate }) => {
            try {
                if (pcRef.current && candidate) {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (err) {
                console.error('Error adding remote ICE candidate', err);
            }
        };

        const handleCallEnded = ({ from }) => {
            endCall();
        };

        socket.on('incoming-call', handleIncomingCall);
        socket.on('call-answered', handleCallAnswered);
        socket.on('ice-candidate', handleRemoteIce);
        socket.on('call-ended', handleCallEnded);

        return () => {
            socket.off('incoming-call', handleIncomingCall);
            socket.off('call-answered', handleCallAnswered);
            socket.off('ice-candidate', handleRemoteIce);
            socket.off('call-ended', handleCallEnded);
        };
    }, [socket]);

    const createPeerConnection = (targetUserId) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ],
        });

        console.log('Creating RTCPeerConnection for', targetUserId);

        pc.onicecandidate = (event) => {
            console.log('onicecandidate:', event.candidate ? 'found' : 'end');
            if (event.candidate) {
                socket.emit('ice-candidate', { to: targetUserId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            console.log('ontrack event - streams:', event.streams.length, 'tracks:', event.track.kind);
            if (event.streams && event.streams.length > 0) {
                console.log('Setting remote stream from ontrack');
                setRemoteStream(event.streams[0]);
            } else if (event.track) {
                console.log('Creating new MediaStream from track');
                const newStream = new MediaStream([event.track]);
                setRemoteStream(newStream);
            }
        };

        // Fallback for older browsers
        pc.onaddstream = (event) => {
            console.log('onaddstream event (legacy)');
            setRemoteStream(event.stream);
        };

        pc.onconnectionstatechange = () => {
            console.log('PC connectionState:', pc.connectionState, 'iceConnectionState:', pc.iceConnectionState, 'signalingState:', pc.signalingState);
            
            if (pc.connectionState === 'failed') {
                console.error('Peer connection failed - attempting restart');
                toast.error('Connection failed. Please try again.');
            }
        };

        pc.onicegatheringstatechange = () => {
            console.log('ICE gathering state:', pc.iceGatheringState);
        };

        pcRef.current = pc;
        return pc;
    };

    const startLocalStream = async () => {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: true
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Local stream acquired:', stream.getTracks());
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('getUserMedia error:', err.name, err.message, err);
            // If video source can't be started, try audio-only fallback
            if (err.name === 'NotReadableError' || err.name === 'OverconstrainedError') {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log('Audio-only stream acquired:', audioStream.getTracks());
                    setLocalStream(audioStream);
                    toast('Video unavailable — using audio only');
                    return audioStream;
                } catch (err2) {
                    console.error('Audio-only fallback failed:', err2.name, err2.message, err2);
                    toast.error('Unable to access microphone');
                    return null;
                }
            }

            // Permission denied - inform user and abort
            if (err.name === 'NotAllowedError' || err.name === 'SecurityError' || err.name === 'PermissionDeniedError') {
                toast.error('Camera/microphone permission denied. Please enable permissions in browser settings.');
                return null;
            }

            // Other errors: report and return null so the app can still attempt a call
            toast.error(`Unable to access camera/microphone: ${err.message}`);
            return null;
        }
    };

    const handleStartCall = async () => {
        if (!selectedUser || !socket) return;
        try {
            console.log('Starting call to:', selectedUser._id);
            const stream = await startLocalStream();
            if (!stream) {
                toast.error('Cannot start call without media stream');
                return;
            }
            const pc = createPeerConnection(selectedUser._id);
            console.log('Adding tracks to peer connection:', stream.getTracks().length);
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));

            const offer = await pc.createOffer();
            console.log('Offer created, setting local description');
            await pc.setLocalDescription(offer);
            console.log('Emitting call-user event');
            socket.emit('call-user', { to: selectedUser._id, offer });
            setInCall(true);
        } catch (err) {
            console.error('Error starting call:', err.name, err.message);
            toast.error('Failed to start call: ' + err.message);
        }
    };

    const handleAcceptCall = async () => {
        if (!incomingCall || !socket) return;
        try {
            const { from, offer } = incomingCall;
            console.log('Accepting call from:', from);
            const stream = await startLocalStream();
            if (!stream) {
                toast.error('Cannot accept call without media stream');
                return;
            }
            const pc = createPeerConnection(from);
            console.log('Adding tracks to peer connection:', stream.getTracks().length);
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            console.log('Setting remote description (offer)');
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('Creating answer');
            const answer = await pc.createAnswer();
            console.log('Setting local description (answer)');
            await pc.setLocalDescription(answer);
            console.log('Emitting make-answer event');
            socket.emit('make-answer', { to: from, answer });
            setInCall(true);
            setIncomingCall(null);
        } catch (err) {
            console.error('Error accepting call:', err.name, err.message);
            toast.error('Failed to accept call: ' + err.message);
        }
    };

    const endCall = () => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach((t) => t.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
        setInCall(false);
        setIncomingCall(null);
    };

    const toggleMute = async () => {
        // Toggle local audio tracks
        const newMuted = !muted;
        setMuted(newMuted);
        if (localStream) {
            localStream.getAudioTracks().forEach((t) => {
                t.enabled = !newMuted;
            });
        } else if (!newMuted) {
            // If trying to unmute but no local stream yet, attempt to get audio
            try {
                const s = await startLocalStream();
                if (s) s.getAudioTracks().forEach((t) => { t.enabled = true; });
            } catch (err) {
                console.warn('Unable to start local audio for unmute', err);
            }
        }
    };

    // attach streams to video elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            console.log('Attaching local stream to video element');
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(err => {
                console.error('Error playing local video:', err);
            });
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            console.log('Attaching remote stream to video element');
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(err => {
                console.error('Error playing remote video:', err);
            });
        }
    }, [remoteStream]);

    useEffect(()=>{
        if(scrollEnd.current && messages){
            scrollEnd.current.scrollIntoView({behavior: 'smooth'});
        }
    },[messages])
  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
        {/* header */}
        <div className='flex items-center gap-3 py-3 mx-4 border-b  border-stone-500'>
            <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
            <p className='flex-1 text-lg text-white flex items-center gap-2'>
                {selectedUser.fullName}
                {onlineUsers.includes(selectedUser._id)
                && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
            </p>
                        <div className='flex items-center gap-3'>
                                <MdOutlineVideoCall
                                    onClick={handleStartCall}
                                className='text-3xl cursor-pointer text-gray-400'
                                 />
                                <MdAddCall onClick={() => { if(inCall) { socket && socket.emit('end-call', { to: selectedUser._id }); endCall(); } }} className='text-2xl cursor-pointer text-gray-400' />
                        </div>
            <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7' />
            <img src={assets.help_icon} alt=""  className='max-md:hidden max-w-5' />
        </div>
        {/* chat body */}
        <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
                            {messages.map((message, index) => (
                                <div key={index} className={`flex items-end p-2 gap-5 justify-end  ${String(message.sender) !== String(authUser._id) && 'flex-row-reverse '}`}>
                    {message.image ? (
                        <img src={message.image} alt="message pic" className='max-w-[230px] border border-gray-700 overflow-hidden mb-8 rounded-lg'/>
                    ) : (
                        <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${String(message.sender) === String(authUser._id) ? 'bg-[#6C5DD3] rounded-br-none' : 'bg-[#3A3347] rounded-bl-none'}`}>
                            {message.text}
                        </p>
                    )}
                    <div className='text-center text-xs'>
                        <img src={String(message.sender) === String(authUser._id) ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" className=' w-7 rounded-full' />
                        <p className="text-xs text-gray-400">{formatMessgaeTime(message.createdAt)}</p>
                    </div>
                </div>
              ))}
              <div ref={scrollEnd}></div>
        </div>
        {/* video overlay for call */}
        {(inCall || incomingCall) && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60'>
                <div className='bg-[#0f1724] p-4 rounded-lg w-[95%] max-w-4xl flex gap-4'>
                    <div className='flex-1'>
                        <video 
                            ref={remoteVideoRef} 
                            autoPlay 
                            playsInline 
                            controls={false}
                            className='w-full h-72 bg-black rounded object-cover'
                        />
                    </div>
                    <div className='w-48 flex flex-col items-center gap-2'>
                        <video 
                            ref={localVideoRef} 
                            autoPlay 
                            muted 
                            playsInline 
                            controls={false}
                            style={{ transform: 'scaleX(-1)' }}
                            className='w-full h-36 bg-black rounded object-cover'
                        />
                        <div className='flex gap-2 mt-2'>
                            {incomingCall && <button onClick={handleAcceptCall} className='px-3 py-1 bg-green-600 rounded'>Accept</button>}
                            <button onClick={toggleMute} className='px-3 py-1 bg-gray-700 rounded flex items-center gap-2'>
                                {muted ? <MdMicOff className='text-white' /> : <MdMic className='text-white' />}
                                <span className='text-sm text-white'>{muted ? 'Unmute' : 'Mute'}</span>
                            </button>
                            <button onClick={() => { if(selectedUser && socket) socket.emit('end-call',{ to: selectedUser._id }); endCall(); }} className='px-3 py-1 bg-red-600 rounded'>End</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* chat input */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 sm:gap-4 p-2 sm:p-3 w-full border-t border-gray-600 bg-[#282142]/80">
            <div className="flex-1 flex items-center justify-between bg-gray-100/10 px-2 sm:px-3 py-1 sm:py-2 rounded-full gap-2">
                {/* Text input */}
                <input
                onChange={(e) => setInput(e.target.value)}
                value={input}
                onKeyDown={(e) => (e.key === "Enter" ? handleSendMessgae(e) : null)}
                type="text"
                placeholder="Send a message"
                className="flex-1 text-xs sm:text-sm p-1 sm:p-2 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent"
                />

                {/* File input (hidden) */}
                <input
                onChange={handleSendImage}
                type="file"
                id="image"
                accept="image/png, image/jpeg, image/jpg"
                hidden
                />
                <label htmlFor="image">
                <img
                    src={assets.gallery_icon}
                    alt="gallery"
                    className="w-4 sm:w-5 mr-1 sm:mr-2 cursor-pointer"
                />
                </label>
            </div>

            {/* Send button */}
            <img
                onClick={handleSendMessgae}
                src={assets.send_button}
                alt="send"
                className="w-6 sm:w-8 cursor-pointer"
            />
            </div>

    </div>
  ) : (
    <div className='h-full w-full flex flex-col justify-center items-center gap-4'>
        <img src={assets.logo_icon} alt="chat empty" className='w-32 md:w-44 max-w-16 max-md:hidden' />
        <p className='text-gray-400 text-center px-4 text-white font-medium text-lg'>Select a user to start conversation</p>
    </div>
  )
}

export default Chat;