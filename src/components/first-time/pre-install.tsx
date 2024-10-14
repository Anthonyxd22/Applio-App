import { useEffect, useState } from "react";
import Background1 from "../svg/background1";

export default function PreInstall() {
    const [status, setStatus] = useState("Starting...");
    const [info, setInfo] = useState("Downloading...");

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:5123/pre-install');
    
        eventSource.onmessage = (event) => {
            console.log(event.data); 
            setStatus(event.data);
            if (event.data.includes('RVC repository downloaded successfully.')) {
                setInfo('Installing....')
                setStatus('Installing... please wait...');
            }
            if (event.data.includes('already exists')) {
                setInfo('You already have the latest version installed. Please wait...');
                setStatus('Completed');
                window.location.href = '/';
            }
            if (event.data.includes('Installing collected packages:')) {
                setInfo('Please wait... this may take a while.');
            }
            if (event.data.includes('RVC CLI has been installed successfully')) {
                setInfo('Finishing installation, please wait...');
                setStatus('Completed');
                window.location.href = '/';
            } 
            if (event.data.includes('RVC repository is up to date. No need to download.')) {
                eventSource.close();
                setStatus('You already have the latest version installed.');
                setInfo('No updates available');
            }
        };
    
        eventSource.onerror = (err) => {
            console.log(info);
            console.error('Error with event source:', err);
            eventSource.close(); 
            setStatus('');
            setInfo('We detected an error. Please try again later.');
        };
    
        return () => {
            eventSource.close(); 
        };
    }, []);
    
    

    return (
        <section className="absolute inset-0 z-50">
            <div className="w-screen h-screen absolute inset-0 bg-[#111111] pointer-events-none">
                <Background1/>
            </div>
            <div className="absolute inset-0 mt-auto flex z-50">
            <div className="z-50 flex flex-col w-full justify-center items-center mx-auto">
            <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl title">Welcome to Applio</h1>
            <p className="text-white/80 text-sm mt-1">We need to install some more data to complete the installation.</p>
            <div className="flex flex-col justify-center items-center mx-auto w-full gap-2 my-4">
            {status && (<span className="px-4 py-2 text-center w-full h-fit max-w-sm bg-[#111111]/20 backdrop-filter backdrop-blur-xl rounded-full border border-white/10 text-xs truncate shadow-2xl shadow-white/20">{status}</span>)}
            {!info.includes('error') && (<span className="text-[10px] text-center text-neutral-300">{info}</span>)}
            {info.includes('error') && (<span className="text-xs text-center px-4 py-1 rounded-xl bg-red-500/20 border border-white/10 text-white">{info}</span>)}
            {info.includes('No updates available') && (<a href="/" className="text-sm rounded-xl px-4 py-1 mt-4 bg-white text-black border border-white/10">Return</a>)}
            </div>
            </div>
            </div>
        </section>
    )
}