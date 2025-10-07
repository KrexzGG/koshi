import { Suspense } from "react";
import { BarLoader } from "react-spinners";

const Layout = ({children}) => {
  return (
    <div className='container mx-auto max-w-screen-2xl px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12'>
        <div className='flex items-center justify-between mb-5'>
            <h1 className='text-6xl font-bold gradient-title animate-gradient'> Industry Insights </h1>
        </div>
        <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="gray"/>}> {children} </Suspense>
       
    </div>
  )
}

export default Layout