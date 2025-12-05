import React, { useEffect,useContext,useRef,useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets';
import { formatMessgaeTime } from '../Lib/Utils';
import { ChatContext } from '../Context/ChatContext';
import { AuthContext } from '../Context/AuthContext';
import toast from 'react-hot-toast';

const Chat = () => {
    const { messages,selectedUser,setSelectedUser,sendMessage,setMessages,getMessage } = useContext(ChatContext);

    const { authUser,onlineUsers } = useContext(AuthContext);

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
        {/* chat input */}
        <div className='absolute bottom-0 left-0 right-0 flex items-center gap-4 p-3 w-full px-2 py-2  border-gray-600'>
              <div className='flex-1 flex items-center justify-between bg-gray-100/12 px-3 py-2 rounded-full gap-2'>
                <input  onChange={(e)=>setInput(e.target.value)} value={input} onKeyDown={(e)=>e.key === "Enter"? handleSendMessgae(e) : null} type="text" placeholder='Send a message' className='flex-1 text-sm p-2 border-none rounded-lg outline-none text-white placeholder-gray-400' />
                <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg, image/jpg' hidden className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' />
                <label htmlFor="image">
                    <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' />
                </label>
              </div>
              <img onClick={handleSendMessgae} src={assets.send_button} alt="" className='w-8 cursor-pointer' />
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
