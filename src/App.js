import axios from 'axios';
import React from 'react';
import { sortBy } from 'lodash';
import SearchIcon from '@material-ui/icons/Search';
import { TextField, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CancelIcon from '@material-ui/icons/Cancel';

import './App.css';
import { ReactComponent as Check } from './check.svg';

const useStyles = makeStyles((theme) => ({
  input: {
    width: '80%',
    fontfamily: 'Lato',
    fontSize:"18px",
  },
  searchButton: {
    background: 'white',
    color: 'black',
    fontSize: '18px',
    fontFamily: 'Lato',
    '&:hover': {
        color: 'white',
        background: 'black',
    }
  },
  filterButton: {
    color: 'black',
    fontFamily: 'Lato',
    '&:hover': {
      color: 'white',
      background: 'black',
      border: '1px white solid'
  }
  }
}));

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const useSemiPersistentState = (key, initialState) => {
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  );

  React.useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};

const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),
};

const storiesReducer = (state, action) => {
  switch (action.type) {
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(
          story => action.payload.objectID !== story.objectID
        ),
      };
    default:
      throw new Error();
  }
};

const App = () => {
  const [searchTerm, setSearchTerm] = useSemiPersistentState(
    'search',
    'React'
  );

  const [url, setUrl] = React.useState(
    `${API_ENDPOINT}${searchTerm}`
  );

  const [stories, dispatchStories] = React.useReducer(
    storiesReducer,
    { data: [], isLoading: false, isError: false }
  );

  const handleFetchStories = React.useCallback(async () => {
    dispatchStories({ type: 'STORIES_FETCH_INIT' });

    try {
      const result = await axios.get(url);

      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits,
      });
    } catch {
      dispatchStories({ type: 'STORIES_FETCH_FAILURE' });
    }
  }, [url]);

  React.useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);

  const handleRemoveStory = item => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    });
  };

  const handleSearchInput = event => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = event => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);

    event.preventDefault();
  };

  return (
    <div className="container">
      <h1 className="headline-primary">My React Stories</h1>

      <SearchForm
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />

      {stories.isError && <p>Something went wrong ...</p>}

      {stories.isLoading ? (
        <p>Loading ...</p>
      ) : (
        <List list={stories.data} onRemoveItem={handleRemoveStory} />
      )}
    </div>
  );
};

const SearchForm = ({
  searchTerm,
  onSearchInput,
  onSearchSubmit,
}) => {
  const classes = useStyles();

  return(
  <form onSubmit={onSearchSubmit} className="search-form">
    <InputWithLabel
      id="search"
      value={searchTerm}
      isFocused
      onInputChange={onSearchInput}
    >
    </InputWithLabel>

    <Button
      type="submit"
      variant="contained"
      disabled={!searchTerm}
      className={classes.searchButton}
      style={{marginLeft: '1%',padding:'1% 4%', width: '20%',}}
      size="large"
      startIcon={<SearchIcon/>}
    >
      Submit
    </Button>
  </form>
  );
};

const InputWithLabel = ({
  id,
  value,
  type = 'text',
  onInputChange,
  isFocused,
  children,
}) => {
  const inputRef = React.useRef();

  React.useEffect(() => {
    if (isFocused) {
      inputRef.current.focus();
    }
  }, [isFocused]);
  const classes = useStyles();

  return (
    <>
      <label htmlFor={id} className="label">
        {children}
      </label>
      &nbsp;
      <TextField
        ref={inputRef}
        id={id}
        color={"primary"}
        type={type}
        value={value}
        onChange={onInputChange}
        className={classes.input}
        variant="outlined" 
        label="Search Term"
      />
    </>
  );
};

const List = ({ list, onRemoveItem }) => {
  
  const [sort, setSort] = React.useState({ sortKey: "NONE", isReverse: false });
 
  const sortFunction = SORTS[sort.sortKey];
  const sortedList = sort.isReverse ? sortFunction(list) : sortFunction(list).reverse();

  const classes = useStyles();

  const handleSort = sortKey => {
    const isReverse = sort.sortKey === sortKey && !sort.isReverse ;
    setSort({sortKey, isReverse})
  }

  return(
  <div>
    <div className="list-header" style={{ display: 'flex'}}>
    <span style={{ width: '44%' }}><Button variant="outlined" className={classes.filterButton} onClick={() => handleSort("TITLE")}>Title</Button></span>
    <span style={{ width: '30%' }}><Button variant="outlined" className={classes.filterButton} onClick={() => handleSort("AUTHOR")}>Author</Button></span>
    <span style={{ width: '16%' }}><Button variant="outlined" className={classes.filterButton} onClick={() => handleSort("COMMENTS")}>Comments</Button></span>
    <span style={{ width: '13%' }}><Button variant="outlined" className={classes.filterButton} onClick={() => handleSort("POINTS")}>Points</Button></span>
    <span style={{ width: '10%', marginTop: '0.6%' }}>ACTIONS</span>
    </div>
  {sortedList.map(item => (
    <Item
      key={item.objectID}
      item={item}
      onRemoveItem={onRemoveItem}
    />
  ))}
</div>
  );
}

const Item = ({ item, onRemoveItem }) => (
  <div className="item" style={{display: "flex"}}>
    <span style={{ width: '40%', marginLeft: '0.8%',  }}>
      <a href={item.url}>{item.title}</a>
    </span>
    <span style={{ width: '30%', marginLeft: '1.2%', }}>{item.author}</span>
    <span style={{ width: '10%' }}>{item.num_comments}</span>
    <span style={{ width: '10%', marginLeft: '2.2%' }}>{item.points}</span>
    <span style={{ width: '10%' }}>
      <Button
        type="Button"
        onClick={() => onRemoveItem(item)}
        variant="contained"
        color="secondary"
        startIcon={<CancelIcon/>}
      >
        Delete
      </Button>
    </span>
  </div>
);

export default App; 
export { storiesReducer, SearchForm, InputWithLabel, List, Item };