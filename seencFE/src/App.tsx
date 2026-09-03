import { useRef } from 'react'
import axios from 'axios'
import { apiBaseUrl } from './config.ts'
import './App.css'
import type {retrievedMedia, movieOrTvResult} from "./interfaces/media.interfaces.ts"
import type { savedEntry } from './interfaces/user.interfaces.ts'
import { searchTMDBType } from './interfaces/tmdb.interfaces.ts'
import { formatMediaResult } from './utils/format.util.ts'
import { removeFromSavedMedia, renewSavedMedia, updateSearchedMedia } from './toolkit/slices/mediaSlice.ts'
import { ToolkitManager } from './toolkit/toolkitManager/toolkitClass.ts'
import { login, logout } from './toolkit/slices/authSlice.ts'
import { useSelector } from 'react-redux'
import type { RootState } from './toolkit/store/store.ts'

const tkManager = new ToolkitManager()

window.addEventListener("load", async () => {
    try {
        const resp = await axios.get(`${apiBaseUrl}/user/me`, {
            withCredentials: true
        });

        const { username, id } = resp.data;

        tkManager.updateState(login, { username, id });

    } catch (error) {
        console.log("User is not logged in.");
    }
});

const viewMedia = async () => {
  const auth = tkManager.getState("auth");
  const userID = auth.user?.id;
  if (!auth.isAuthenticated) { console.error("User session expired. Please log in!"); return; }
  if (!userID) { console.error("Error retrieving user id for saved media!"); return; }

  try {
    const resp = await axios.get(`${apiBaseUrl}/user/getMedia`, {
      params: {
        userID: userID
      }
    });
    const media = Array.isArray(resp.data) ? resp.data : [];
    tkManager.updateState(renewSavedMedia, media);
  } catch (error) {
    console.error(error)
    //updateUploaded(JSON.stringify(error));
  }
}

const searchMedia = async (searchUp: string, searchType: string = searchTMDBType.MULTI) => {
    try {
      const resp: retrievedMedia = await axios.get(`${apiBaseUrl}/tmdb/media`, {
        params: {
          query: searchUp,
          searchType: searchType
        }
      }
      ).then((res) => res.data)
      // console.log(resp);
      const filteredResults: movieOrTvResult[] = formatMediaResult(resp)
      // console.log(filteredResults)
      tkManager.updateState(updateSearchedMedia, filteredResults)
    } catch (error) {
      console.error(error)
  }
}

const handleLogIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault()
  const formElement = e.currentTarget.form;
  if (!formElement) {console.error("Form not found!"); return;}
  const formData = new FormData(formElement);
  const username = formData.get("loginUsernameField") as string;
  const password = formData.get("loginPasswordField") as string;
  const user = await axios.post(`${apiBaseUrl}/user/log-in`, {
      username,
      password
    }, {
      withCredentials: true
    }
  );

  if (!user) {
    console.error("User not found!");
    return;
  }
  const userAuth = {
    username: username,
    id: user.data.id
  }

  tkManager.updateState(login, userAuth);
  formElement?.reset()
}

const handleLogOut = async () => {
  const auth = tkManager.getState("auth")
  if (!auth.isAuthenticated) {
    console.error("No account to sign out from!");
    return;
  }
  try {
    await axios.post(`${apiBaseUrl}/user/log-out`, {}, { withCredentials: true })
  } catch (error) {
    console.error("Error logging out: ", error)
  }

  tkManager.updateState(logout);
  console.log("Logged out successfully!");
}

const handleSignUp = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault()
  const formElement = e.currentTarget.form;
  // console.log(formElement)
  if (!formElement) { console.error("No sign-up form found!"); return; }
  const formData = new FormData(formElement)
  const username = formData.get("signupUsernameField") as string;
  const password = formData.get("signupPasswordField") as string;
  const email = formData.get("signupEmailField") as string;

  const user = await axios.post(`${apiBaseUrl}/user/sign-up`, {
      username,
      email,
      password
    },
    { withCredentials: true }
  )

  if (!user) {
    console.error("User not found!");
    return;
  }
  // console.log(JSON.stringify(user.data))
}

const addMedia = async (tmdbID: number) => {
    const auth = tkManager.getState('auth')
    const media: movieOrTvResult[] = tkManager.getState("media").searchedMedia;
    if (auth.user?.id == null){
      console.log("No User ID Found");
      return;
    }
    // console.log(tmdbID)
    const desiredMedia: movieOrTvResult | undefined = media.find((entry) => entry.tmdb_id == tmdbID)
    if (!desiredMedia){
      console.log("Error, media not found!");
      return;
    }
    const type = desiredMedia.media_type;
    try { 
      const payload = {...desiredMedia, user_id: auth.user.id}
      const { popularity, ...mediaData } = payload
      await axios.post(`${apiBaseUrl}/data/add/media`, mediaData, { withCredentials: true })
      viewMedia()
    } catch (err) {
      console.error(err)
      return
    }

    try {
      if (type === "MOVIE"){
        await axios.post(`${apiBaseUrl}/data/add/media/movie-unit`, { tmdb_id: tmdbID }, { withCredentials: true })
        await axios.post(`${apiBaseUrl}/data/add/misc/character-appearances/movie`, {tmdb_id: tmdbID}, { withCredentials: true })
      } else if (type === "TV"){
        await axios.post(`${apiBaseUrl}/data/add/media/tv-unit`, {tmdb_id: tmdbID, season_number: 1}, { withCredentials: true })
        await axios.post(`${apiBaseUrl}/data/add/misc/character-appearances/tv`, {tmdb_id: tmdbID, season_number: 1}, { withCredentials: true })
      }
    } catch (error) {
      console.error(error) 
    }
}

async function removeEntry(element: HTMLParagraphElement) {
  const clickedId: number | undefined = element.dataset.savedTmdb ? parseInt(element.dataset.savedTmdb, 10) : undefined;
  const auth = tkManager.getState("auth")
  if (clickedId === undefined) {
    console.error("No tmdb_id found for the clicked element.");
    return;
  }
  if (auth.user?.id === null) {
    console.error("No userID provided.");
    return;
  }

  try {
    const resp = await axios.delete(`${apiBaseUrl}/user/deleteMedia`, {
      data: {
        tmdb_id: clickedId, 
        userID: auth.user?.id
      }
    });
    //console.log(resp)
    if (resp.data.removed) {
      const savedMedia = tkManager.getState("media").savedMedia;
      const entry = savedMedia.find((item: savedEntry) => item.tmdb_id === clickedId);
      if (!entry) {
        console.error("No saved media entry found for the clicked tmdb_id.");
        return;
      }
      tkManager.updateState(removeFromSavedMedia, entry)
    }
    viewMedia()
  } catch (error) {
    console.error(error);
  }
}

function App() {
  const currAuth = useSelector((state: RootState) => state.auth)
  const currMedia = useSelector((state: RootState) => state.media)
  const savedMedia: savedEntry[] = currMedia.savedMedia
  const searchedMedia: movieOrTvResult[] = currMedia.searchedMedia
  const currSearchRef = useRef("");
  return (
    <>
      <div className='m-auto w-fit h-fit justify-center content-center bg-amber-100 flex flex-col mb-1'>
        <h1>Current User: {currAuth.user?.username || "N/A"}</h1>
        <form className='flex flex-col mb-1'>
          { !currAuth.isAuthenticated && (
            <>
            <label htmlFor='loginUsernameField'>Username: </label>
            <input type='text' id='loginUsernameField' name='loginUsernameField' placeholder='Enter username!'></input>
            <label htmlFor='loginPasswordField'>Password: </label>
            <input type='password' id='loginPasswordField' name='loginPasswordField' placeholder='Enter password!'></input>
            </>
          )}
          <div className='flex justify-around'>
            { !currAuth.isAuthenticated && (
              <button type='submit' className='hover:cursor-pointer hover:bg-amber-500' onClick={(e) => handleLogIn(e)}>Log In</button>
            ) }
            { currAuth.isAuthenticated && (
              <button type='button' className='hover:cursor-pointer hover:bg-amber-500' onClick={handleLogOut}>Log Out</button>
            ) }
          </div>
        </form>
        <form className='flex flex-col'>
          <label htmlFor='signupEmailField'>Email: </label>
          <input type='text' id='signupEmailField' name='signupEmailField' placeholder='Enter email!'></input>
          <label htmlFor='signupUsernameField'>Username: </label>
          <input type='text' id='signupUsernameField' name='signupUsernameField' placeholder='Enter username!'></input>
          <label htmlFor='signupPasswordField'>Password: </label>
          <input type='signupPassword' id='signupPasswordField' name='signupPasswordField' placeholder='Enter password!'></input>
          <button type='submit' className='hover:cursor-pointer hover:bg-amber-500' onClick={(e) => handleSignUp(e)}>Sign Up</button>
        </form>
      </div>
      <div className='mt-2 mb-2 m-auto w-fit h-fit grid justify-center bg-amber-200'>
        <h1>View Media</h1>
        <button onClick={viewMedia} className='hover:bg-amber-300 bg-amber-100 cursor-pointer'>View</button>
        <div className='bg-amber-600 max-w-3xl savedMediaDiv'>
          {savedMedia && savedMedia.length > 0 ? (
            savedMedia.map((entry:savedEntry, index:number) => <p key={index} data-saved-tmdb={entry.tmdb_id} className='savedMediaEntry' onClick={(e) => removeEntry(e.currentTarget)}>{entry.title}</p>) 
          ) : (
            "No Media Found"
          )}
        </div>
      </div>
      <button onClick={() => searchMedia("Evangelion")} className='bg-amber-50 m-auto flex justify-center cursor-pointer'>Search Evangelion</button>
      <div className='mt-2 mb-2 m-auto w-fit h-fit grid justify-center bg-amber-200'>
        <h1>Search Movies!</h1>
        <input type='text' placeholder='Enter title here!' className='p-2' onChange={(e) => {currSearchRef.current = (e.target.value)}}/>
        <button className='w-fit h-fit bg-amber-400 cursor-pointer m-auto' onClick={() => searchMedia(currSearchRef.current)}>Search</button>
        <div className='w-3xl h-80 flex justify-center content-center bg-amber-900 overflow-y-auto overflow-x-hidden wrap-break-word'>
          <ul className='text-amber-50 flex flex-wrap'>
            {searchedMedia.map((entry:movieOrTvResult, index: number) => (
              <li key={index} className='mediaBanner w-[30%] h-auto' onClick={(e) => addMedia(Number(e.currentTarget.dataset.mediaId))} data-media-id={entry.tmdb_id}>{entry.title}
              <img src={entry.poster_url} loading='lazy'></img>
              </li>
            )) || "No Results Found"}
          </ul>
        </div>
      </div>
    </>
  )
}

export default App
