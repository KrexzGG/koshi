import React from 'react'

const MainLayout = ({children}) => {
  return (
    <div className='container mx-auto max-w-screen-2xl px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 mt-24 mb-20'>
      {children}
    </div>
  )
}

export default MainLayout