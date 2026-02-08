import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios'

function App() {
  const [post, setPost] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, [])

  const fetchNotes = () => {
    axios.get('https://node-js-lxpr.onrender.com/api/notes')
      .then((res) => setPost(res.data))
      .catch((err) => console.log(err))
  }

  const handlesubmit = (e) => {
    e.preventDefault()

    // POST request to create a new note
    axios.post('https://node-js-lxpr.onrender.com/api/notes', {
      title: title,
      description: description
    })
      .then((res) => {
        console.log(res.data)
        // Clear form fields
        setTitle('')
        setDescription('')
        // After successful creation, update the notes list and render the new note
        fetchNotes()
      })
      .catch((err) => console.log(err))
  }
  const deleteNote = (id) => {
    // DELETE request to delete a note
    axios.delete(`https://node-js-lxpr.onrender.com/api/notes/${id}`)
      .then((res) => {
        console.log(res.data)
        // Refresh the notes list
        fetchNotes()
      })
      .catch((err) => console.log(err))
  }

  const editNote = (id) => {
    const newTitle = prompt('Enter new title:');
    const newDescription = prompt('Enter new description:');

    // Validate that user didn't cancel and inputs aren't empty
    if (newTitle === null || newTitle.trim() === '') {
      alert('Please enter valid title');
      return;
    }
    if (newDescription === null || newDescription.trim() === '') {
      alert('Please enter valid description');
      return;
    }
    // PUT request to update a note
    axios.patch(`https://node-js-lxpr.onrender.com/api/notes/${id}`, {
      title: newTitle,
      description: newDescription
    })
      .then((res) => {
        console.log(res.data)
        // Refresh the notes list
        fetchNotes()
      })
      .catch((err) => console.log(err))
  }

  return (
    <>
      <div className='title'>
        <h1>This is Test Series for FullStack</h1>
      </div>
      <div className="form">
        <form onSubmit={handlesubmit}>
          <input
            type="text"
            placeholder='Enter Title...'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder='Enter Description...'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <button>Submit</button>
        </form>
      </div>
      <section className='container'>
        {
          post.length > 0 ? post.map((item) => (
            <div key={item._id} className='post-card'>
              <h2 className='post-title'>{item.title}</h2>
              <p className='post-description'>{item.description}</p>
              <div className="button-container">
              <button className='edit-btn' onClick={()=> editNote(item._id)}>Edit</button>
              <button className='dlt-btn' onClick={() => deleteNote(item._id)}>Delete</button>
              </div>
            </div>
          )) : <p>No cards available</p>
        }
      </section>
    </>
  )
}

export default App
