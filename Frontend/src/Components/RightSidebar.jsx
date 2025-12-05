import React from 'react'
import { useContext } from 'react';
import { ChatContext } from '../Context/ChatContext';
import { AuthContext } from '../Context/AuthContext';
import { useState } from 'react';
import { useEffect } from 'react';
import assets from '../assets/assets.js';

const RightSidebar = () => {

    const {selectedUser, messages} = useContext(ChatContext);
    const {logoutUser,onlineUsers} = useContext(AuthContext);

    const [msgImages,setMsgImages] = useState([]);

    useEffect(()=>{
        setMsgImages(
            messages.filter(msg=> msg.image).map(msg=>msg.image)
        )
    },[messages])

  return selectedUser &&  (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? 'max-md:hidden': ''}`} >
      <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
        <img src={selectedUser?.profilePic || assets.avatar_icon  } alt=""
        className='w-20 aspect-[1/1] rounded-full' />
        <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
            {onlineUsers.includes(selectedUser._id) && 
                <p className='w-2 h-2 rounded-full bg-green-500'></p>
            }
            {selectedUser.fullName}
            </h1>

        <p className='px-10 mx-auto'>{selectedUser.bio}</p>
      </div>
      <hr className='border-[#fffffff50] my-4' />
      <div className='px-5 text-xs'>
        <p>Media</p>
        <div className='mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80'>
            {msgImages.map((url, index) => (
                <div key={index} onClick={() => window.open(url)} className="cursor-pointer rounded">
                    <img src={url} alt={`media-${index}`} className="w-full h-auto rounded-md" />
                </div>
            ))}
        </div>
      </div>
      <button onClick={()=>logoutUser()} className='absolute bottom-5 left-1/2 transform -translate-x-1/2
        bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-none
        text-sm font-light px-4 py-2 rounded-md cursor-pointer'>
            LogOut
            </button>
    </div>
  )
}

export default RightSidebar;
