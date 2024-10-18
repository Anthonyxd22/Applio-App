import "./App.css";
import { useEffect, useState } from "react";
import { platform, version } from "@tauri-apps/plugin-os";
import { Effect, getCurrentWindow } from "@tauri-apps/api/window";
import { isFirstRun, setNotFirstRun } from "./scripts/isFirstTime";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from "./components/layout/header";
import { TitleBar } from "./components/layout/titlebar";
import Welcome from "./components/first-time/welcome";
import PreInstall from "./components/first-time/pre-install";
import { supabase } from "./utils/database";
import { invoke } from "@tauri-apps/api/core";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { open } from '@tauri-apps/plugin-shell'
import Background1 from "./components/svg/background1";

function App() {
  const [loading, setLoading] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  useEffect(() => {
    const handleCloseRequested = async (event: any) => {
      event.preventDefault(); 
        const response = await fetch('http://localhost:5123/stop');
        localStorage.removeItem('appInitialized');

        if (!response.ok) {
          alert('Error, please report on GitHub');
        } else {
          console.log('Server shutting down...');
          getCurrentWindow().destroy();
        }
    };

    const currentWindow = getCurrentWindow();
    
    const unlisten = currentWindow.onCloseRequested((event) => {
      handleCloseRequested(event);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [])

  useEffect(() => {
    const initialized = localStorage.getItem('appInitialized');

    if (!initialized) {
      localStorage.setItem('appInitialized', 'true');
    }
  }, []);

  useEffect(() => {
    async function setWindowEffect() {
      const currentPlatform = await platform();
      const osVersion = await version();
      if (currentPlatform === "windows") {
        if (osVersion >= "10.0.22000.0") {
        document.documentElement.style.background = 'transparent';
        document.documentElement.style.backgroundColor = 'rgba(17, 17, 17, 0.7)';
        await getCurrentWindow().setEffects({effects: [Effect.Acrylic]});
        setLoading(false);
        }
      } else {
        document.documentElement.style.background = '#111111';
        setLoading(false);
      }

      console.log(currentPlatform);
    }

    checkFirstRun();
    checkUpdates();
    setWindowEffect();
    initializeDiscordRpc();
  }, []);

  const initializeDiscordRpc = async () => {
      try {
        await invoke("set_discord_presence", {
          state: "Creating awesome AI Audios.",
          details: "Using the easiest voice cloning tool, now in app."
        });
      } catch (error) {
        console.error("Error starting discord presence:", error);
      }
  };

  const checkFirstRun = async () => {
    const isFirstTime = await isFirstRun(); 
    console.log(isFirstTime);
    if (isFirstTime) {
        console.log('First time run, continuing...');
        window.location.href = '/first-time';
        setNotFirstRun();
        
    } else {
        console.log('Not first time...')
    }
}

  const checkUpdates = async () => {
    if (window.location.pathname === "/") {
      const eventSource = new EventSource('http://localhost:5123/check-update');
      eventSource.onmessage = (event) => {
        console.log(event.data);
        if (event.data.includes('up to date')) {
          setUpdateAvailable(false);
          eventSource.close();
        } else {
          setUpdateAvailable(true);
          eventSource.close();
        }
      }
      return () => {
        eventSource.close(); 
    };
  }
}

  return (
    <Router>
      {updateAvailable && window.location.pathname !== "/first-time" && (<a href="/first-time" className="hover:bg-black/20 slow absolute left-24 top-2 w-fit p-2 px-4 shadow-lg shadow-green-500/10 h-fit border border-white/20 rounded-xl" style={{zIndex: 300}}>
        <p className="text-xs">Update available!</p>
      </a>)}
      <TitleBar />
      <div className="flex w-screen h-screen gap-0">
      {window.location.pathname !== "/first-time" && window.location.pathname !== "/pretraineds" && <Header />}
      {loading && <div className="absolute inset-0 w-screen h-screen bg-[#111111] slow z-50">
        <span className="flex justify-center items-center m-auto h-screen">
        <svg
								aria-hidden="true"
								className="w-8 h-8 animate-spin text-neutral-800 fill-white"
								viewBox="0 0 100 101"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
									fill="currentColor"
								/>
								<path
									d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
									fill="currentFill"
								/>
							</svg>
        </span>
      </div>}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/first-time" element={<FirstTime />} />
        <Route path="/models" element={<Models />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/convert" element={<Convert />} />
        <Route path="/pretraineds" element={<DownloadPretraineds />} />
      </Routes>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="grid h-screen w-screen">
      <main className="flex flex-col items-center justify-start mt-8 w-full overflow-auto">
        <div className="grid grid-cols-3 grid-rows-3 gap-4 w-full h-full p-4">
          <div className="col-span-3 row-span-2 rounded-xl bg-[#111111]/50 w-full h-full border border-white/20 shadow-2xl shadow-[#00AA68]/20">
            <div className="pt-6 flex flex-col w-full h-full rounded-xl justify-center items-center noise relative" style={{ background: 'radial-gradient(150% 150% at 50% 10%, #111111A3 40%, #00AA68 100%)' }}>  
            <h1 className="text-[100px] font-bold title">Applio</h1>
            </div>
          </div>
          <div className="col-span-1 rounded-xl bg-[#111111]/50 w-full h-full border border-white/20">
            <div className="pt-6 flex flex-col w-full h-full rounded-xl justify-end items-start noise relative p-4">  
                <p className="text-xl">Now with <span className="title font-semibold text-green-400">Applio AI</span></p> 
                <p className="text-sm text-neutral-300">All models will have a description generated with artificial intelligence based on the character's name, language and profession.</p>
            </div>
          </div>
          <div className="col-span-1 rounded-xl bg-[#111111]/50 w-full h-full border border-white/20">
          <div className="pt-6 flex flex-col w-full h-full rounded-xl justify-end items-start noise relative p-4">  
                <p className="text-xl">Cloud <span className="text-blue-400">sync</span></p>
                <p className="text-sm text-neutral-300">You will be able to see the inferences you have made, the trained models or any data from this application elsewhere in our ecosystem.</p>
            </div>
          </div>
          <div className="col-span-1 rounded-xl bg-[#111111]/50 w-full h-full border border-white/20">
          <div className="pt-6 flex flex-col w-full h-full rounded-xl justify-end items-start noise relative p-4">  
                <p className="text-xl">Customize to your 
                <span className="text-red-400 ml-1">l</span>
                <span className="text-yellow-400">i</span>
                <span className="text-green-400">k</span>
                <span className="text-blue-400">i</span>
                <span className="text-purple-400">n</span>
                <span className="text-pink-400">g</span>
                </p>
                <p className="text-sm text-neutral-300">In your settings you can change the theme of the application to your liking, or import a pre-made one from the community.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )};

function NotFound() {
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <h1 className="text-center text-xl font-bold title">Not Found :(</h1>
    </div>
  )};


function FirstTime() {
  const [page, setPage] = useState(0)

  const handleNextPage = () => {
      setPage(page + 1);
  }


  return (
      <main className="absolute inset-0 bg-[#0a0a0a] w-full h-full p-4 flex flex-col justify-center items-center">
      {page === 0 && (<Welcome next={handleNextPage} />)}
       {page === 1 && (<PreInstall />)}
      </main>
  )
}

function Models() {
  const [value, setValue] = useState("");
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [info, setInfo] = useState("")
  const [error, setError] = useState(false)

  useEffect(() => {
    async function getModels() {
      setLoading(true);
      if (!value) {
        setData([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('models').select('*').ilike('name', `%${value}%`).order("created_at", { ascending: false }).limit(12);
      if (error) {
        console.log(error);
        setData(null);
      } 
      if (data && data.length > 0) {
        console.log('models', data);
        setData(data);
        setLoading(false);
      } else {
        setData(null);
        setLoading(false);
      }
      
    }
    getModels();
  }, [value]);

  const downloadModel = async (id: string, link: string, epochs: string, algorithm: string, name: string, author: string, from: string) => {
    setDropdownOpen(true)
    setInfo('Starting...');
    setStatus('Sending request...');
    setError(false)
    try {
      const eventSource = new EventSource(`http://localhost:5123/download?link=${encodeURIComponent(link)}&id=${encodeURIComponent(id)}&epochs=${encodeURIComponent(epochs)}&algorithm=${encodeURIComponent(algorithm)}&name=${encodeURIComponent(name)}&author=${encodeURIComponent(author)}&from=${encodeURIComponent(from)}`)

      eventSource.onmessage = (event) => {
        console.log(event.data)
        setStatus(event.data)
        if (event.data.includes('Downloading model')) {
          setInfo('Downloading')
          setStatus('Downloading model...');
        }
        if (event.data.includes('downloaded!')) {
          setInfo('Downloaded');
          setStatus('Downloaded successfully');
          eventSource.close();
        }
        if (event.data.includes('error')) {
          setInfo('Error');
          setStatus('Error downloading model, please try again.');
          setError(true)
          eventSource.close();
        } 
      };
  
      eventSource.onerror = (err) => {
        console.log(info);
        console.error('Error with event source:', err);
        eventSource.close(); 
        setError(true)
        setStatus('We detected an error, please try again.');
      };

      return () => {
        eventSource.close(); 
      };
    } catch (error) {
      console.error('Error:', error);
      setStatus('We detected an error. Please try again later.');
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col py-12 pr-4 relative p-4">
      {dropdownOpen && ( 
        <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-2xl backdrop-filter w-full h-full">
          <div className="w-full h-full flex justify-center items-center">
            <div className="w-full max-w-2xl h-fit min-h-[18svh] border border-white/20 bg-[#111111] shadow rounded-xl p-4">
            <h1 className="font-medium text-2xl">Downloading model</h1>
            <div className="w-full flex rounded-full h-2.5 dark:bg-gray-700 mt-4">
              <div className="bg-green-500 h-2.5 rounded-full" style={{width: info === 'Starting...' ? '20%' : info === 'Downloading' ? '50%' : info === 'Downloaded' || info === 'Error' ? '100%' : '0%'}} />
            </div>
            {!error && (<p className="text-xs text-neutral-400 mt-2">Status: {status}</p>)}
            {error && (<div className="px-4 py-2 my-4 text-sm rounded-xl bg-red-500/20 border border-white/10 text-neutral-300">{status}</div>)}
            {(info === 'Downloaded' || error) && (<button type="button" className="flex justify-end ml-auto px-6 py-1.5 bg-white text-black rounded-xl text-sm" onClick={() => setDropdownOpen(false)}>Close</button>)}
            </div>
          </div>
        </div> 
    )}
      <input type="text" className="w-full h-12 rounded-xl border-white/20 border focus:outline-none bg-[#111111]/50 p-4" placeholder="Search..." value={value} onChange={(e) => setValue(e.target.value)} />
      <div className="w-full  mt-6">
      {!loading && data === null && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <h1 className="text-center text-neutral-300">No results found</h1>
        </div>
      )}
      {loading && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <h1 className="text-center text-neutral-300">Loading...</h1>
        </div>
      )}
      {!value && (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <h1 className="text-center text-neutral-300">Start searching for your favorite model</h1>
        </div>
      )}
      {!loading && data && (
        <div className="grid grid-cols-3 gap-2 w-full">
          {data.map((item: any) => (
            <button
              onClick={() => downloadModel(item.id, item.link, item.epochs, item.algorithm, item.name, item.author_username, item.server_name)}
              type="button"
              className="w-full h-full min-h-[20svh] text-left rounded-xl border-white/20 border focus:outline-none bg-[#111111]/50 p-4 hover:shadow-xl hover:shadow-white/20 slow flex flex-col items-start justify-start"
              key={item.id}
            >
              <h1 className="font-semibold title text-neutral-200 text-lg">{item.name}</h1>
              <p className="text-xs">created by {item.author_username} at 												
              <span className="pl-1">{new Date(item.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span></p>
            <div className="justify-end flex mt-auto gap-2">
            <p className="bg-[#111111] px-2 rounded-md text-sm">{item.epochs} epochs</p>
            <p className="bg-[#111111] px-2 rounded-md text-sm">{item.algorithm}</p>
            <p className="bg-[#111111] px-2 rounded-md text-sm">{item.likes} likes</p>
            </div>
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

function Settings() {
  const [appVersion, setAppVersion] = useState("");
  const [tauriVersion, setTauriVersion] = useState("");
  const [system, setSystem] = useState("")
  const [systemVersion, setSystemVersion] = useState("")

  const handleTestBackend = async () => {
    try {
      const response = await fetch("http://localhost:5123/");
      if (response.ok) {
        alert("Backend is running!");
      } else {
        alert("Backend is not running!");
      }
    } catch (error) {
      console.error(error);
    }
  }

  const checkUpdates = async () => {
      const eventSource = new EventSource('http://localhost:5123/check-update');
      eventSource.onmessage = (event) => {
        console.log(event.data);
        if (event.data.includes('up to date')) {
          alert('No update available')
          eventSource.close();
        } else {
          alert('Update available')
          eventSource.close();
        }
      }
      return () => {
        eventSource.close(); 
    };
}

  useEffect(() => {
    async function checkVersion() {
      const appversion = await getVersion();
      const tauriversion = await getTauriVersion();
      const platformName = platform();
      const osVersion = await version();

      setAppVersion(appversion);
      setTauriVersion(tauriversion);
      setSystem(platformName)
      setSystemVersion(osVersion)
    }

    checkVersion();
  }, []);

  return (
    <div className="grid h-screen w-screen">
      <main className="flex flex-col items-end justify-end mt-8 w-full overflow-auto">
        <div className="flex gap-4 w-full h-full p-4 pb-0">
          <div className="col-span-3 row-span-2 rounded-t-xl bg-[#111111]/20 w-full h-full border border-white/20 ">
            <div className="flex flex-col w-full h-full rounded-xl justify-start items-start p-4">  
              <h1 className="text-xl font-bold title">Settings</h1>
              <h2 className="text-lg font-medium mt-4">Developer</h2>
              <div className="w-full h-0.5 rounded-xl bg-white/20 mt-2 mb-4"/>
              <div className="flex gap-2">
              <a href="/first-time" type="button" className="px-3 hover:bg-white/20 slow rounded-lg border border-white/10 bg-white/10 py-1 text-sm">Install RVC</a>
              <a href="/pretraineds" type="button" className="px-3 hover:bg-white/20 slow rounded-lg border border-white/10 bg-white/10 py-1 text-sm">Download pretraineds</a>
              <button onClick={handleTestBackend} type="button" className="px-3 hover:bg-white/20 slow rounded-lg border border-white/10 bg-white/10 py-1 text-sm">Test backend</button>
              <button onClick={checkUpdates} type="button" className="px-3 hover:bg-white/20 slow rounded-lg border border-white/10 bg-white/10 py-1 text-sm">Check updates</button>
              </div>
              <div className="flex justify-end items-end mt-auto ml-auto flex-col">
              <p className="text-neutral-400 text-xs">v{appVersion}</p>
              <p className="text-neutral-400 text-xs">tauri-{tauriVersion}</p>
              <p className="text-neutral-400 text-xs">{system}-{systemVersion}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function DownloadPretraineds() {
  const [status, setStatus] = useState("Starting...");
  const [info, setInfo] = useState("Downloading...");

    useEffect(() => {
      const eventSource = new EventSource('http://localhost:5123/pretraineds');

      eventSource.onmessage = (event) => {
          console.log(event.data); 
          setStatus(event.data);

          if (event.data.includes('installed successfully')) {
              eventSource.close();
              setInfo('Finishing....')
              setStatus('Installing... please wait...');
              window.location.href = '/'
          }
      }

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
    <h1 className="font-bold text-4xl lg:text-5xl xl:text-6xl title">Downloading pretraineds</h1>
    <p className="text-white/80 text-sm mt-1">We need to install some more data to complete the installation.</p>
    <div className="flex flex-col justify-center items-center mx-auto w-full gap-2 my-4">
    {status && (<span className="px-4 py-2 text-center w-full h-fit max-w-sm bg-[#111111]/20 backdrop-filter backdrop-blur-xl rounded-full border border-white/10 text-xs truncate shadow-2xl shadow-white/20">{status}</span>)}
    {!info.includes('error') && (<span className="text-[10px] text-center text-neutral-300">{info}</span>)}
    {info.includes('error') && (<span className="text-xs text-center px-4 py-1 rounded-xl bg-red-500/20 border border-white/10 text-white">{info}</span>)}
    </div>
    </div>
    </div>
</section>
  )
}

function Convert()  {
  const [models, setModels] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false)
  const [info, setInfo] = useState("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState(false)
  const [input, setInput] = useState("")
  const [pth, setPth] = useState("")
  const [index, setIndex] = useState("")
  const [output, setOutput] = useState("")
  const [pitch, setPitch] = useState(0)
  const [indexRate, setIndexRate] = useState(0.3)
  const [filterRadius, setFilterRadius] = useState(3)
  
  useEffect(() => {
    async function getLocalModels() {
      try {
        const response = await fetch('http://localhost:5123/get-models');
        if (response.ok) { 
          const models = await response.json();
          setModels(models); 
        } else {
          console.error('Error fetching models:', response.statusText);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }
    
    getLocalModels();
  }, []);
  
  useEffect(() => {
    if (models[currentIndex] && models[currentIndex].model_index_file) {
      console.log('model_index_file:', models[currentIndex].model_index_file);
      console.log('model_pth_file:', models[currentIndex].model_pth_file);
      setIndex(models[currentIndex].model_index_file);
      setPth(models[currentIndex].model_pth_file);
    }
  }, [models, currentIndex]);

  const nextModel = () => {
    if (currentIndex < models.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevModel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentModel = models[currentIndex];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch('http://localhost:5123/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error uploading file');
      }

      const data = await response.json();
      console.log(data);
      setUploaded(true)
      setInput(data[0].file_path)
    } catch (error) {
      console.error(error);
    }
  };

  const convert = async () => {
    setInfo('Starting...');
    setStatus('Sending request...');
    setError(false)
    try {
      const eventSource = new EventSource(`http://localhost:5123/convert?input=${encodeURIComponent(input)}&pth=${encodeURIComponent(pth)}&index=${encodeURIComponent(index)}&pitch=${encodeURIComponent(pitch)}&indexRate=${encodeURIComponent(indexRate)}&filterRadius=${encodeURIComponent(filterRadius)}`);
      console.log(`http://localhost:5123/convert?input=${encodeURIComponent(input)}&pth=${encodeURIComponent(pth)}&index=${encodeURIComponent(index)}&pitch=${encodeURIComponent(pitch)}&indexRate=${encodeURIComponent(indexRate)}&filterRadius=${encodeURIComponent(filterRadius)}`)
      eventSource.onmessage = (event) => {
        console.log(event.data)
        setStatus(event.data)
        if (event.data.includes('error')) {
          setInfo('Error');
          setStatus('An error has occurred, please try again.');
          setError(true)
          eventSource.close();
        } 

        if (event.data.includes('finished')) {
          const audioPath = event.data.split('Audio path: ')[1];
          console.log(audioPath)
          getAudio(audioPath)
          setInfo('Conversion completed!');
          setStatus('Your audio has been converted successfully.');
          
          eventSource.close();
        }
      };
  
      eventSource.onerror = (err) => {
        console.log(info);
        console.error('Error with event source:', err);
        eventSource.close(); 
        setError(true)
        setStatus('We detected an error, please try again.');
      };

      return () => {
        eventSource.close(); 
      };
    } catch (error) {
      console.error('Error:', error);
      setStatus('We detected an error. Please try again later.');
    }
    
  }

  const openDocs = async () => {
    open('https://docs.applio.org')    
  };

  function transformPath(path: string) {
    return path.replace(/\\/g, '/'); 
  }

  async function getAudio(path: string) {
    const transformedPath = transformPath(path); 
    try {
      const response = await fetch(`http://localhost:5123/audio?path=${encodeURIComponent(transformedPath)}`);
      if (!response.ok) {
        throw new Error('Error getting audio');
      }
      const audioBlob = await response.blob();
      setOutput(URL.createObjectURL(audioBlob));
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div className="grid h-screen w-screen">
      <main className="flex flex-col items-end justify-center mt-8 w-full overflow-auto">
        <div className="flex gap-4 w-full h-full p-4 pb-4">
          <div className="col-span-3 row-span-2 rounded-xl w-full h-full">
            <div className="flex gap-2 w-full h-full rounded-xl">  
              <div className="grid grid-cols-1 grid-rows-3 gap-2 w-full max-w-[40svh] h-full">
              <div className="relative border border-white/20 rounded-xl row-span-2 w-full h-full">
              <div
                className="absolute w-full h-full rounded-xl backdrop-blur-3xl backdrop-filter noise opacity-40"
                style={{ background: 'linear-gradient(#111111A3 10%, #00AA68)', zIndex: -1 }}
              />
              <div className="w-full h-full flex flex-col py-2">
                <p className="text-center text-neutral-200 mt-2 text-xl max-w-xl mx-4 truncate">
                  {currentModel ? currentModel.name : 'No model selected'}
                </p>
                <div className="w-full h-full gap-2">
                  <div className="flex justify-between items-center my-auto h-full gap-2 p-4">
                    <button
                      type="button"
                      className="bg-white/10 hover:bg-white/20 disabled:hover:bg-white/10 slow disabled:opacity-60 border border-white/10 p-2 rounded-full z-50"
                      onClick={prevModel}
                      disabled={currentIndex === 0}
                    >
                      <svg
                        className="w-6 h-6 max-md:w-3 max-md:h-3 opacity-60"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L9.41421 12L15.7071 18.2929C16.0976 18.6834 16.0976 19.3166 15.7071 19.7071C15.3166 20.0976 14.6834 20.0976 14.2929 19.7071L7.29289 12.7071C7.10536 12.5196 7 12.2652 7 12C7 11.7348 7.10536 11.4804 7.29289 11.2929L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289Z"
                          fill="#ffffff"
                        />
                      </svg>
                    </button>
                    {currentModel && (
                    <ul className="noise rounded-xl gap-1 flex flex-col w-full text-center mx-4">
                    <li className="text-sm max-md:text-xs text-neutral-200 bg-black/40 border border-white/20 px-4 py-1 rounded-xl">{currentModel ? currentModel.epochs : 'Undefined'} epochs</li>
                    <li className="text-sm max-md:text-xs text-neutral-200 bg-black/40 border border-white/20 px-4 py-1 rounded-xl">{currentModel ? currentModel.algorithm : 'Undefined algorithm'}</li>
                    <li className="text-sm max-md:text-xs text-neutral-200 bg-black/40 border border-white/20 px-4 py-1 rounded-xl">{currentModel ? currentModel.author : 'Undefined author'}</li>
                    <li className="text-sm max-md:text-xs text-neutral-200 bg-black/40 border border-white/20 px-4 py-1 rounded-xl">{currentModel ? currentModel.from : 'Undefined server'}</li>
                    </ul>
                    )}
                    <button
                      type="button"
                      className="bg-white/10 hover:bg-white/20 disabled:hover:bg-white/10 disabled:opacity-60 slow border border-white/10 p-2 rounded-full z-50"
                      onClick={nextModel}
                      disabled={currentIndex === models.length - 1}
                    >
                      <svg
                        className="w-6 h-6 max-md:w-3 max-md:h-3 opacity-60"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M8.29289 4.29289C8.68342 3.90237 9.31658 3.90237 9.70711 4.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L9.70711 19.7071C9.31658 20.0976 8.68342 20.0976 8.29289 19.7071C7.90237 19.3166 7.90237 18.6834 8.29289 18.2929L14.5858 12L8.29289 5.70711C7.90237 5.31658 7.90237 4.68342 8.29289 4.29289Z"
                          fill="#ffffff"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-center text-neutral-300 text-xs z-50">
                  Download more models{' '}
                  <a href="/models" className="text-white hover:underline">
                    here
                  </a>.
                </p>
              </div>
            </div>
            <div className="relative border border-white/20 h-full w-full rounded-xl p-4 bg-[#111111]/10 enabled:hover:bg-[#111111]/50 disabled:hover:bg-[#111111]/10 slow flex flex-col gap-2 justify-center items-center">
                <div className="absolute w-full h-full rounded-xl backdrop-blur-3xl backdrop-filter noise opacity-40" style={{ background: 'linear-gradient(#111111A3 100%, #00AA68)' }} />
                {uploaded ? (
                <svg className="w-16 h-16 opacity-60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g id="SVGRepo_bgCarrier" strokeWidth="0" />
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
                <g id="SVGRepo_iconCarrier">
                  <g id="Interface / Check">
                    <path id="Vector" d="M6 12L10.2426 16.2426L18.727 7.75732" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                </g>
              </svg>
                ) : (
                  <svg className="w-16 h-16 opacity-80 z-50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"/>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"/>
                  <g id="SVGRepo_iconCarrier">
                    <path d="M22 20.8201C15.426 22.392 8.574 22.392 2 20.8201" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.0508 16V2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.09961 6.21997L10.6096 2.60986C10.7895 2.42449 11.0048 2.27715 11.2427 2.17651C11.4806 2.07588 11.7363 2.02417 11.9946 2.02417C12.2529 2.02417 12.5086 2.07588 12.7465 2.17651C12.9844 2.27715 13.1997 2.42449 13.3796 2.60986L16.8996 6.21997" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                </svg>
                )}
                <p className="text-sm text-neutral-300 z-50 truncate max-w-3xl">{file ? file.name : 'Select your audio.'}</p>
                <input
                  disabled={uploaded}
                  type="file"
                  accept="audio/*"
                  className="absolute inset-0 opacity-0 z-40 enabled:cursor-pointer"
                  onChange={handleFileChange}
                />
              </div>
              {file && <button type="button" onClick={handleUpload} disabled={uploaded} className="w-full border border-white/20 rounded-xl py-2 h-full enabled:hover:bg-[#111111]/20 slow disabled:opacity-50">Upload</button>}
              </div>
              <div className="w-full h-full grid grid-cols-1 grid-rows-12 gap-2">
              <div className="row-span-full w-full h-full border border-white/20 rounded-xl p-4 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                  <h2 className="text-neutral-200 text-lg">Pitch</h2>
                  <div className="flex gap-2 justify-center items-center">
                  <p className="text-sm text-neutral-200">{pitch}</p>
                  <input value={pitch} onChange={(e) => setPitch(Number(e.target.value))} type="range" defaultValue='0' min='0' max='10' className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                  </div>
                  <p className="text-xs text-neutral-300">Set the pitch of the audio. Higher values result in a higher pitch.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                  <h2 className="text-neutral-200 text-lg">Index Rate</h2>
                  <div className="flex gap-2 justify-center items-center">
                  <p className="text-sm text-neutral-200">{indexRate}</p>
                  <input value={indexRate} onChange={(e) => setIndexRate(Number(e.target.value))} type="range" defaultValue='0.3' min='0' max='1' step='0.1' className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                  </div>
                  <p className="text-xs text-neutral-300">Control the influence of the index file on the output. Higher values mean stronger influence. Lower values can help reduce artifacts but may result in less accurate voice cloning.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                  <h2 className="text-neutral-200 text-lg">Filter Radius</h2>
                  <div className="flex gap-2 justify-center items-center">
                  <p className="text-sm text-neutral-200">{filterRadius}</p>
                  <input value={filterRadius} onChange={(e) => setFilterRadius(Number(e.target.value))} type="range" defaultValue='3' min='0' max='6' className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                  </div>
                  <p className="text-xs text-neutral-300">Apply median filtering to the extracted pitch values if this value is greater than or equal to three. This can help reduce breathiness in the output audio.</p>
                  </div>
              </div>
              {(status || info) && (
                <div className={`min-h-fit w-full h-full border border-white/20 rounded-xl p-4 ${error ? 'bg-red-500/10' : ''}`}>
                  <p className="font-medium">{info}</p>
                  <p className="text-sm text-neutral-300 max-w-5xl truncate">{status}</p>
                  {error && <p className="text-neutral-400 text-xs mt-1">Maybe you have done something wrong? <button className="text-neutral-300 hover:underline" onClick={openDocs}>Check the docs</button>.</p>}
                </div>
              )}
              {info === 'Conversion completed!' && output && (
                <audio controls className="w-full">
                  <source 
                  id="audio-player"
                  className="audio-player"
                  src={output}
                  type="audio/wav"
                  />
                </audio>
              )}
              <div className="relative group">
                {!uploaded && (
                  <p className="absolute left-0 right-0 bottom-full mb-4 text-xs text-red-400 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    First upload your audio!
                  </p>
                )}
                <button
                  className="min-h-12 w-full bg-white disabled:opacity-60 text-black rounded-xl h-full enabled:hover:bg-white/80 slow"
                  type="button"
                  disabled={!!status || !uploaded}
                  onClick={convert}
                >
                  Convert
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
        </main>
    </div>
  )
}

export default App;
