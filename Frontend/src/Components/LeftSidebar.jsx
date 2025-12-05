import React from 'react';
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';
import { ChatContext } from '../Context/ChatContext';
import { useState } from 'react';
import { useEffect } from 'react';

const LeftSidebar = () => {
      const [open, setOpen] = useState(false);
    const {getUsers, users, selectedUser, setSelectedUser,
            unSeenMessages,setUnSeenMessages, } = useContext(ChatContext);

  const navigate = useNavigate();
  const {logoutUser, onlineUsers} = useContext(AuthContext);
    const [input, setInput] = useState("");
    const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
        )
    : users;

    useEffect(()=>{
        getUsers();
    },[onlineUsers])

  return (
    <div
  className={`bg-[#1E1B2E]/10 p-3 h-full flex flex-col  overflow-y-scroll border-r border-gray-600 
    ${selectedUser ? 'max-md:hidden' : 'w-[280px]'}`}
>
  <div className="p-2">
    <div className="flex justify-between items-center">
      <img src={assets.logo} alt="logo" className="w-40" />
         <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 bg-[#282142] text-gray-100 rounded-md"
      >
        ☰
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full right-0 z-20 w-32 p-3 rounded-md bg-[#282142] border border-gray-600 text-gray-100 text-center">
          <p
            onClick={() => {
              navigate("/profile");
              setOpen(false);
            }}
            className="cursor-pointer text-sm"
          >
            Edit Profile
          </p>
          <hr className="my-2 border-t border-gray-500" />
          <p
            onClick={() => {
              logoutUser();
              setOpen(false);
            }}
            className="cursor-pointer text-sm"
          >
            Logout
          </p>
        </div>
      )}
    </div>

    </div>

    <div className="flex items-center gap-3 bg-[#2A2540] mt-1 px-4 py-3 rounded-full">
      <img src={assets.search_icon} alt="search" className="w-4" />
      <input
      onChange={(e)=>setInput(e.target.value)}
        type="text"
        className="bg-transparent border-none outline-none text-white text-sm placeholder-[#c8c8c8] flex-1"
        placeholder="Search User"
      />
    </div>
  </div>

  <div className="flex flex-col -mt-4">
    {(filteredUsers || []).map((user, index) => (
      <div
        key={index}
        onClick={() => {
          setSelectedUser(user);
          setUnSeenMessages((prev) => ({ ...prev, [user._id]: 0 }));
        }}
        className={`relative flex items-center gap-3 p-3 mb-2 rounded-lg cursor-pointer hover:bg-[#2A2540] ${
          selectedUser && selectedUser._id === user._id ? 'bg-[#2A2540]' : ''
        }`}
      >
        <img
          src={user?.profilePic || assets.avatar_icon}
          alt=""
          className="w-[35px] aspect-square rounded-full"
        />
        <div className="flex flex-col leading-5">
          <div className="flex flex-col leading-5">
            <p className="text-white">{user.fullName}</p>
            <span
                className={`text-xs ${
                    onlineUsers.includes(user._id) ? 'text-green-400' : 'text-gray-400'
                }`}
                >
                {onlineUsers.includes(user._id) ? 'online' : 'offline'}
                </span>

            </div>
        </div>
        {(unSeenMessages?.[user._id] || 0) > 0 && (
            <p className="absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50">
                {unSeenMessages?.[user._id] || 0}
            </p>
            )}
      </div>
    ))}
  </div>
</div>
  );
};

export default LeftSidebar;