import { useState, type Dispatch, type RefObject, type SetStateAction } from 'react'
import axios from 'axios'
import { apiBaseUrl } from './config.ts'
import './App.css'
import { useRef } from 'react'
import type {retrievedMedia, retrievedResult, movieOrTvResult} from "./interfaces/media.interfaces.ts"
import type { savedEntry } from './interfaces/user.interfaces.ts'
import { searchTMDBType } from './interfaces/tmdb.interfaces.ts'


const viewMedia = async (updateUploaded: Dispatch<SetStateAction<savedEntry[]>>, currentIDRef: number | null) => { //RefObject<number | null>
  if (currentIDRef == null){
    console.log("No User ID Linked. ")
    return;
  }
  try {
    const resp = await axios.get(`${apiBaseUrl}/user/getMedia`, {
      params: {
        userID: currentIDRef
      }
    });
    updateUploaded(resp.data)
  } catch (error) {
    console.error(error)
    //updateUploaded(JSON.stringify(error));
  }
}

const searchMedia = async (searchUp: string, updateSearched: Dispatch<SetStateAction<movieOrTvResult[]>>, searchType: string = searchTMDBType.MULTI) => {
    try {
      const resp: retrievedMedia = await axios.get(`${apiBaseUrl}/tmdb/media`, {
        params: {
          query: searchUp,
          searchType: searchType
        }
      }
      ).then((res) => res.data)
      // console.log(resp);
      const filteredResults: movieOrTvResult[] = resp.results.map((entry: retrievedResult) => ({
        title: entry.title ?? entry.name ?? "Untitled",
        poster_url: entry?.poster_path,
        tmdb_id: entry.id,
        description: entry.overview,
        media_type: entry.media_type,
        release_date: entry?.release_date ? new Date(entry.release_date) : entry?.first_air_date ? new Date(entry.first_air_date) : new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        popularity: entry.popularity
      })).toSorted((a: movieOrTvResult, b: movieOrTvResult) => b.popularity - a.popularity);
      // console.log(filteredResults)
      updateSearched(filteredResults)
    } catch (error) {
    if (axios.isAxiosError(error)) {
      updateSearched(error.response?.data ?? error.message);
    } else if (error instanceof Error) {
      console.log([error.message]);
    } else {
      console.log([String(error)]);
    }
  }
}

const linkAccount = async (setCurrentUser: Dispatch<SetStateAction<string>>, currentIDRef: RefObject<number | null>) => {
  if (currentIDRef.current != null){
    currentIDRef.current = null;
    setCurrentUser("N/A")
  } else {
    const accID = (document.getElementById("accountIDField") as HTMLInputElement).value;
    // console.log(accID)
    if (!accID) return;
    const returnedUser = await axios.get(`${apiBaseUrl}/user/linkUser`, {
      params: {
        id: accID
      }
    });
    if (returnedUser.data == null){
      setCurrentUser("User Not Found")
    } else {
      setCurrentUser(returnedUser.data.username)
      currentIDRef.current = returnedUser.data.id;
    }
  }

}


const addMedia = async (tmdbID: number, currentUserID: number | null, mediaList: movieOrTvResult[]) => {
    if (currentUserID == null){
      console.log("No User ID Found");
      return;
    }
    // console.log(tmdbID)
    const desiredMedia: movieOrTvResult | undefined = mediaList.find((entry) => entry.tmdb_id == tmdbID)
    if (!desiredMedia){
      console.log("Error, media not found!");
      return;
    }
    try { 
      const payload = {...desiredMedia, user_id: currentUserID}
      const { popularity, ...mediaData } = payload
      await axios.post(`${apiBaseUrl}/media/add`, mediaData )
    } catch (err) {
      // console.log("Error in addMedia function!")
      console.error(err)
    }
}

async function removeEntry(element: HTMLParagraphElement, userID: number | null = null, updateUploaded: Dispatch<SetStateAction<savedEntry[]>>) {
  const clickedId: number | undefined = element.dataset.savedTmdb ? parseInt(element.dataset.savedTmdb, 10) : undefined;
  if (clickedId === undefined) {
    console.error("No tmdb_id found for the clicked element.");
    return;
  }
  if (userID === null) {
    console.error("No userID provided.");
    return;
  }

  try {
    const resp = await axios.delete(`${apiBaseUrl}/user/deleteMedia`, {
      data: {
        tmdb_id: clickedId, 
        userID: userID
      }
    });
    //console.log(resp)
    viewMedia(updateUploaded, userID)
  } catch (error) {
    console.error(error);
  }
}

function App() {
  const [uploadedMedia, updateUploaded] = useState<savedEntry[]>([]);
  const [searchedMedia, updateSearched] = useState<movieOrTvResult[]>([]);
  const [currentSearch, updateCurrentSearch] = useState("");
  const [currentUser, setCurrentUser] = useState("N/A")
  const currentIDRef = useRef<number | null>(null)
  return (
    <>
      <div className='m-auto w-fit h-fit justify-center content-center bg-amber-100 grid mb-1'>
        <h1>Current User: {currentUser}</h1>
        <div>
          <input type="number" placeholder='Enter User ID' className='p-0.5' id='accountIDField'/>
          <button className='bg-amber-200 hover:cursor-pointer' onClick={() => linkAccount(setCurrentUser, currentIDRef)}>{currentIDRef.current == null ? "Link Account" : "Unlink Account"}</button>
        </div>
      </div>
      <div className='m-auto w-fit h-fit justify-center content-center bg-amber-100 grid'>
        <h1 className='bg-amber-200 w-auto'>Add Show</h1>
        <div className='grid m-auto w-fit h-fit'>
          <label htmlFor='mediaTitle'>Title</label>
          <input type='text' name='mediaTitle' id='mediaTitle' placeholder='Enter Media Name' />
          <label htmlFor='mediaType'>Type</label>
          <input type='text' name='mediaType' id='mediaType' placeholder='Enter Media Type' />
          <label htmlFor='mediaDescription'>Description</label>
          <input type='text' name='mediaDescription' id='mediaDescription' placeholder='Enter Media Description' />
          <label htmlFor='media_release'>Release Date</label>
          <input type='date' name='media_release' id='media_release' placeholder='Enter Media Release' />
        </div>
        {/* <button className='bg-amber-500 hover:border-amber-800 hover:cursor-pointer hover:border-2 m-auto' onClick={async () => {
          addMedia(-1, currentIDRef.current)
        }}>Add</button> */}
      </div>
      <div className='mt-2 mb-2 m-auto w-fit h-fit grid justify-center bg-amber-200'>
        <h1>View Media</h1>
        <button onClick={() => viewMedia(updateUploaded, currentIDRef.current)} className='hover:bg-amber-300 bg-amber-100 cursor-pointer'>View</button>
        <div className='bg-amber-600 max-w-3xl savedMediaDiv'>
          {uploadedMedia && uploadedMedia.length > 0 ? (
            uploadedMedia.map((entry:savedEntry, index:number) => <p key={index} data-saved-tmdb={entry.tmdb_id} className='savedMediaEntry' onClick={(e) => removeEntry(e.currentTarget, currentIDRef.current, updateUploaded)}>{entry.title}</p>) 
          ) : (
            "No Media Found"
          )}
        </div>
      </div>
      <button onClick={() => searchMedia("Evangelion", updateSearched)} className='bg-amber-50'>Search Evangelion</button>
      <div className='mt-2 mb-2 m-auto w-fit h-fit grid justify-center bg-amber-200'>
        <h1>Search Movies!</h1>
        <input type='text' placeholder='Enter title here!' className='p-2' onChange={(e) => {updateCurrentSearch(e.target.value)}}/>
        <button className='w-fit h-fit bg-amber-400 cursor-pointer m-auto' onClick={() => searchMedia(currentSearch, updateSearched)}>Search</button>
        <div className='w-3xl h-80 flex justify-center content-center bg-amber-900 overflow-y-auto overflow-x-hidden wrap-break-word'>
          <ul className='text-amber-50 flex flex-wrap'>
            {searchedMedia.map((entry:movieOrTvResult, index:number) => (
              <li key={index} className='mediaBanner w-[30%] h-auto' onClick={(e) => addMedia(Number(e.currentTarget.dataset.mediaId), currentIDRef.current, searchedMedia)} data-media-id={entry.tmdb_id}>{entry.title}
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
