import React, { useState, useContext } from 'react';
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';

const Profile = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const [file, setFile] = useState(null); // actual File object
  const [preview, setPreview] = useState(authUser.profilePic); // string URL for preview
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Case 1: no new file selected
    if (!file) {
      await updateProfile({ fullName: name, bio, profilePic: preview });
      navigate('/');
      return;
    }

    // Case 2: new file selected
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePic: base64Image, fullName: name, bio });
      navigate('/');
    };
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected)); // preview immediately
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center">
      <div className="w-8/7 max-w-2xl backdrop-blur-2xl border-2 border-indigo-600 flex max-sm:flex-col-reverse rounded-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-8 flex-1 text-white">
          <h3 className="text-lg font-semibold">Profile Details</h3>
          <label htmlFor="avatar" className="flex flex-col items-center cursor-pointer gap-2">
            <input
              onChange={handleFileChange}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img
              src={preview || assets.avatar_icon}
              alt="profile"
              className="w-20 h-20 rounded-full object-cover"
            />
            Upload Profile Picture
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            required
            placeholder="yourname"
            className="p-2 border border-indigo-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="p-2 border border-indigo-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="your bio"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 py-2 rounded-md font-medium"
            style={{ backgroundSize: '200% 200%', animation: 'gradientShift 5s ease infinite' }}
          >
            Save Changes
          </button>
          <style>
            {`
              @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}
          </style>
        </form>
        <img
          src={assets.logo_icon}
          alt="logo"
          className="w-[min(20vw,200px)] pr-5 hidden [@media(max-width:950px)]:hidden md:block"
        />
      </div>
    </div>
  );
};

export default Profile;