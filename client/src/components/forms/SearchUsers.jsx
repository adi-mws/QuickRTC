import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SearchUsers({ showSearchUsers, setShowSearchUsers, createNewChat }) {
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);


    // Handle search input and prevent spaces
    const handleChange = (e) => {
        const value = e.target.value.replace(/\s/g, ''); // Remove spaces
        setSearch(value);
    };

    useEffect(() => {
        if (showSearchUsers) {
            setSearch('');
            setUsers([]);
        }
    }, [showSearchUsers])

    // Fetch matching users
    useEffect(() => {
        const fetchUsers = async () => {
            if (search.trim() === '') {
                setUsers([]);
                return;
            }

            setLoading(true);

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/user/get-users?username=${search}`,
                    { withCredentials: true }
                );

                setUsers(response.data.users);
                // console.log(response.data.users);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchUsers, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const handleNewChat = (user) => {
        setShowSearchUsers(false);
        createNewChat(user);
    }

    return (
        <>
            <div className={`${showSearchUsers ? 'opacity-100 z-200' : 'opacity-0 z-[-1]'} transparent transition duration-500  h-full fixed top-0 left-0 backdrop-blur-xs  flex-col items-center justify-center w-full`} onClick={(e) => { setShowSearchUsers(false) }}>
                <div className={`${showSearchUsers ? 'scale-100 opacity-100 z-201' : 'scale-0 opacity-0 z-[-1]'} fixed top-[50%] left-[50%]  transition duration-500  bg-white dark:bg-zinc-800 translate-y-[-50%] translate-x-[-50%] shadow-md rounded-lg p-6 w-full max-w-lg`} onClick={(e) => { e.stopPropagation() }}>
                    <h1 className="text-xl mb-4 dark:text-white">Search Users and Start Chatting</h1>

                    <form className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={handleChange}
                            placeholder="Search by username"
                            className="w-full p-3 outline-0 border-0 dark:bg-zinc-900 focus:outline-1 focus:outline-zinc-700 text-sm text-white rounded-lg"
                        />

                        {loading && (
                            <div className="absolute top-full left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
                        )}
                    </form>

                    {/* Dropdown with matching users */}
                    <div className="mt-4  dark:bg-zinc-900 text-sm rounded-lg h-100">
                        {users.length > 0 ? (
                            <ul>
                                {users.map((user) => (
                                    <li
                                        key={user?.id}
                                        className="p-3 hover:bg-zinc-100 border-b-1 border-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-900 transition cursor-pointer flex gap-5"
                                    >
                                        <img src={user?.pfp} alt="profile_pic" className='text-sm w-10 h-10 rounded-full' />
                                        <div className="flex flex-col flex-1/3">
                                            <span className="name dark:text-white text-lg">{user?.name}</span>
                                            <span className="usernam dark:font-normal font-bold text-primary">{user?.username}</span>

                                        </div>
                                        <button className='flex-1/5 bg-primary-2 rounded-lg hover:bg-primary-1 text-white' onClick={() => { handleNewChat(user) }}>Start Chatting</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !loading && search && (
                                <div className="p-3 text-zinc-500">No matching users found</div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
