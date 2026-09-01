import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import axios from 'axios'
import { apiBaseUrl } from './config.ts'
import './App.css'
import { useDispatch, useSelector } from 'react-redux'
import type {retrievedMedia, movieOrTvResult} from "./interfaces/media.interfaces.ts"
import type { savedEntry } from './interfaces/user.interfaces.ts'
import { searchTMDBType } from './interfaces/tmdb.interfaces.ts'
import { formatMediaResult } from './utils/format.util.ts'
import type { RootState } from './toolkit/store/store.ts'
import { removeFromSavedMedia, renewSavedMedia, updateSearchedMedia } from './toolkit/slices/mediaSlice.ts'
import { ToolkitManager } from './toolkit/toolkitManager/toolkitClass.ts'

const tkManager = new ToolkitManager()
const dispatch = useDispatch();
const viewMedia = async () => { //RefObject<number | null>
  const auth = tkManager.getState("auth");
  const userID = auth.user?.id;
  if (!auth.isAuthenticated) return new Error("User session expired. Please log in!")
  if (!userID) return new Error("Error retrieving user id for saved media!")

  try {
    const resp = await axios.get(`${apiBaseUrl}/user/getMedia`, {
      params: {
        userID: userID
      }
    });
    tkManager.updateState(renewSavedMedia, resp.data);
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
  const user = await axios.get(`${apiBaseUrl}/user/log-in`, {
    params: {
      username: username,
      password: password
    }
  })

  if (!user) {
    console.error("User not found!");
    return;
  }
  formElement?.reset()
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
      await axios.post(`${apiBaseUrl}/data/add/media`, mediaData )
      if (type === "MOVIE"){
        console.log(await axios.get(`${apiBaseUrl}/tmdb/credits`, {
          params: {
            tmdb_id: tmdbID
          }
        }))
      } else if (type === "TV"){
        console.log(await axios.get(`${apiBaseUrl}/tmdb/tv/details`, {
          params: {
            tmdb_id: Number(tmdbID)
          }
        }))
        console.log(await axios.get(`${apiBaseUrl}/tmdb/tv/seasonEpisodesInfo`, {
          params: {
            tmdb_id: tmdbID,
            season_number: 1,
          }
        }))
        console.log(await axios.post(`${apiBaseUrl}/data/add/mediaUnits`, {tmdb_id: tmdbID}))
      }
    } catch (err) {
      // console.log("Error in addMedia function!")
      console.error(err)
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
      const entry = useSelector((state: RootState) => state.media.savedMedia).find((entry: savedEntry) => entry.tmdb_id === clickedId);
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
  const currAuth = tkManager.getState("auth")
  const currMedia = tkManager.getState("media")
  const savedMedia: savedEntry[] = currMedia.savedMedia
  const searchedMedia: movieOrTvResult[] = currMedia.searchedMedia
  const currSearchRef = useRef("");
  return (
    <>
      <div className='m-auto w-fit h-fit justify-center content-center bg-amber-100 flex flex-col mb-1'>
        <h1>Current User: {currAuth.user?.username || "N/A"}</h1>
        <form className='flex flex-col mb-1'>
          {/* <label htmlFor='emailField'>Email: </label>
          <input type='text' id='emailField' name='emailField' placeholder='Enter email!'></input> */}
          <label htmlFor='loginUsernameField'>Username: </label>
          <input type='text' id='loginUsernameField' name='loginUsernameField' placeholder='Enter username!'></input>
          <label htmlFor='loginPasswordField'>Password: </label>
          <input type='password' id='loginPasswordField' name='loginPasswordField' placeholder='Enter password!'></input>
          <button type='submit' className='hover:cursor-pointer hover:bg-amber-500' onClick={(e) => handleLogIn(e)}>Log In</button>
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
            {searchedMedia.map((entry:movieOrTvResult, index:number) => (
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
