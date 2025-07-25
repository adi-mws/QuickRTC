import React, { useEffect, useState, useRef } from 'react';
import ChatListHeader from './ChatListHeader';
import { useChat } from '../hooks/ChatsContext';
import { usePopUp } from '../hooks/PopUpContext';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getImageUrl } from '../utils/imageUtils';
import { LogOut, UserRoundPlus } from 'lucide-react';

export default function ChatsList() {
    const {
        chats,
        setChats,
        loading,
        setSelectedChat,
        emitSeenMessages,
        selectedChat,
        onlineUsers,
        socket
    } = useChat();

    const { setShowSearchUsers } = usePopUp();
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [sliderMenu, setSliderMenu] = useState(false);
    const dropdownRef = useRef(null);
    const sideBarRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [filteredChats, setFilteredChats] = useState([]);
    const handleLogout = () => {
        logout();
        navigate("/login");
    };


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSliderMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleReadCount = async (chatId, userId) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/chats/message-read`,
                { chatId: chatId, userId: userId },
                { withCredentials: true }
            );
            if (response.status === 200) {
                setChats(prev =>
                    prev.map(chat => (chat._id === chatId ? { ...chat, unreadCount: 0 } : chat))
                );
            } else {
                console.warn(response.data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleChatClick = (chat) => {
        setSelectedChat(chat);
        handleReadCount(chat._id, user.id);
        emitSeenMessages(chat._id);

        navigate(`/chats/${chat._id}`);

    };

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            const chatId = newMessage.chat;
            const isCurrentChat = selectedChat && selectedChat === chatId;
            const isMessageFromSelf = newMessage.sender._id === user.id;
            // Making this chat to appear on top if a message is sent or received
            setChats(prev => {
                const updated = prev.map(chat =>
                    chat._id === chatId
                        ? { ...chat, lastMessage: newMessage }
                        : chat
                );

                const updatedChat = updated.find(chat => chat._id === chatId);
                const others = updated.filter(chat => chat._id !== chatId);

                return [updatedChat, ...others];
            });

            // Managing the readCounts when a new message is received
            setChats(prevChats => {
                return prevChats.map(chat => {
                    if (chat._id === chatId) {


                        if (!isMessageFromSelf && !isCurrentChat) {
                            return {
                                ...chat,
                                latestMessage: newMessage,
                                unreadCount: (chat.unreadCount || 0) + 1
                            };
                        } else {

                            return {
                                ...chat,
                                latestMessage: newMessage
                            };
                        }
                    }
                    return chat;
                });
            });
        };

        // console.log(chats)

        // console.log(user)

        socket.on('newMessage', handleNewMessage);

        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [socket, selectedChat, user.id]);

    useEffect(() => {
        const search = searchTerm.trim().toLowerCase();

        const filtered = chats.filter(chat => {
            const name = chat?.participant?.name?.toLowerCase() || "";
            const username = chat?.participant?.username?.toLowerCase() || "";

            return name.includes(search) || username.includes(search);
        });

        setFilteredChats(filtered);
    }, [chats, searchTerm]);
    return (
        <div
            ref={sideBarRef}
            className="chats-list dark:bg-zinc-900 h-full border-r border-zinc-300 dark:border-zinc-900 flex flex-col"
        >
            {/* Header */}
            <ChatListHeader />

            {/* Search bar */}
            <input
                type="text"
                placeholder="Search chats..."
                className="w-full py-3 px-5 text-sm my-2 border border-zinc-800 dark:text-zinc-300 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Chat list (scrollable section) */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {!loading && Array.isArray(filteredChats) &&
                    filteredChats.map((chat) => (
                        <div
                            key={chat._id}
                            onClick={() => handleChatClick(chat)}
                            className="chat-list-item flex w-full cursor-pointer dark:hover:bg-zinc-950 items-center gap-5 py-4 px-5 border-b border-zinc-200 dark:border-zinc-800"
                        >
                            <div className="pfp-user-details flex justify-between w-full gap-5">
                                <div className="flex items-center w-full gap-4">
                                    <div className="pfp-wrapper relative">
                                        <img
                                            src={getImageUrl(chat.participant?.pfp)}
                                            className="min-w-10 min-h-10 h-10 w-10 rounded-full"
                                            alt=""
                                        />
                                        {onlineUsers.includes(chat.participant?._id) && (
                                            <span className="w-3 h-3 rounded-full bg-green-700 absolute bottom-0 right-1" />
                                        )}
                                    </div>
                                    <div className="user-details flex flex-1 w-full flex-col gap-1">
                                        <div className="name-and-time flex w-full items-center justify-between">
                                            <p className="user-name truncate-text max-w-30 dark:text-white text-sm">
                                                {chat.participant?.name}
                                            </p>
                                            <p className="time text-xs dark:text-zinc-300">
                                                {chat?.lastMessage?.createdAt &&
                                                    new Date(chat.lastMessage.createdAt).toLocaleTimeString("en-GB", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                            </p>
                                        </div>
                                        {user?.showLastMessage ? (
                                            <p className="last-message dark:text-zinc-400 text-sm max-w-50 truncate-text">
                                                {chat?.lastMessage?.sender?._id === user.id && (
                                                    <span className="dark:text-zinc-100">You: </span>
                                                )}
                                                {chat?.lastMessage?.content}
                                            </p>
                                        ) : (
                                            <p className="user-username dark:text-zinc-400 font-bold max-w-50 text-xs">
                                                {chat.participant?.username}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="read-count-wrapper flex justify-end items-center">
                                    {chat.unreadCount > 0 && (
                                        <span className="unread-count bg-red-600 rounded-full text-white w-5 h-5 justify-center items-center flex text-xs">
                                            {chat.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Footer (Profile section) */}
            <div className="chats-list-header bg-slate-100 dark:bg-zinc-900 border-t border-zinc-800 flex flex-row items-center h-21 px-5 justify-between">
                {user && (
                    <div className="relative flex flex-row gap-2 items-center" ref={dropdownRef}>
                        <div
                            className="profile flex gap-3 items-center rounded-full bg-zinc-200 p-1 dark:bg-zinc-800 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                            onClick={() => setSliderMenu(!sliderMenu)}
                        >
                            <img src={getImageUrl(user?.pfp)} className="pfp w-12 h-12 bg-fill rounded-full" alt="Profile" />
                        </div>
                        <div className="chat-header-labels flex gap-1 flex-col">
                            <p className="chat-user-username dark:text-gray-400 text-sm">{user.username}</p>
                            <p className="chat-user-name text-green-500 flex gap-1 text-xs items-center">
                                <span className="h-2 w-2 rounded-full bg-green-500 block" />Online
                            </p>
                        </div>
                        <div
                            className={`fixed left-0 ${sliderMenu ? 'bottom-0' : 'bottom-[-400px]'} transition-all duration-500 mt-2 w-48 bg-white dark:bg-zinc-800 shadow-lg rounded-md z-10`}
                        >
                            <ul className="py-2">
                                <li onClick={() => navigate('/chats/profile')} className="flex items-center px-4 gap-5 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600 cursor-pointer transition">
                                    <i className="fas fa-user"></i> <span> Profile</span>
                                </li>
                                <li
                                    className="flex items-center gap-4 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 cursor-pointer transition"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={20} /> Logout
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
                <button className="dark:text-white text-sm me-5" onClick={() => setShowSearchUsers(true)}>
                    <UserRoundPlus onClick={() => navigate('/chats/contacts')} />
                </button>
            </div>
        </div>
    );

}
