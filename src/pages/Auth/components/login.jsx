import React from 'react';
import { Link } from 'react-router-dom'





export default ({ email, password, update, canSubmit, handleSubmit }) => {
  return (
    <div className="h-full bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 ">
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-md sm:px-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-900">TRANSPORT NY</h2>
            <p className="text-lg font-thin text-gray-600">
              <span href="#" className="font-thin text-blue-400 hover:text-blue-500">
               Login
              </span>
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className='pt-4'>
              <label htmlFor="email" className="block text-sm font-thin text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={ e => update({ email: e.target.value }) }
                  autoComplete="email"
                  placeholder='Enter your email'
                  required
                  className="appearance-none block w-full px-3 py-2 border-b border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-thin text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={e => update({ password: e.target.value })}
                  autoComplete="current-password"
                  placeholder='Enter your password'
                  required
                  className="appearance-none block w-full px-3 py-2 border-b border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to='/auth/login' className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </form>
      </div>
    </div>
    </div>
  )
}