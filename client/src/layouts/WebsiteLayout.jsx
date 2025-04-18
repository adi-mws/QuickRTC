import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'

export default function WebsiteLayout() {
  return (
    <div className='WebsiteLayout w-full'>
      <Header />
      <Outlet />
    </div>
  )
}
