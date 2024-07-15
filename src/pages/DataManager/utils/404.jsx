import React from 'react';


export const NoMatch = () =>
    <div className='h-screen flex-1 flex flex-col text-gray-900 bg-gray-100'>
        <div className="flex-1 flex items-center justify-center flex-col">
          <div className="text-8xl font-bold">404</div>
          <div className="text-2xl">Page not Found</div>
          <div className="text-2xl">Oops, Something went missing...</div>
        </div>
    </div>


const config = {
  mainNav: false,
  component: NoMatch,
  layoutSettings: {
    fixed: true,
    headerBar: true
  }
}

export default config;
