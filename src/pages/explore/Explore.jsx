import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import InfiniteScroll from "react-infinite-scroll-component";
import Select from "react-select";

import "./style.scss";

import useFetch from "../../hooks/useFetch";
import { fetchDataFromApi } from "../../utils/api";
import ContentWrapper from "../../components/contentWrapper/ContentWrapper";
import MovieCard from "../../components/movieCard/MovieCard";
import Spinner from "../../components/spinner/Spinner";
import { BsJustify } from "react-icons/bs";

let filters = {};

const sortbyData = [
  { value: "popularity.desc", label: "Popularity Descending" },
  { value: "popularity.asc", label: "Popularity Ascending" },
  { value: "vote_average.desc", label: "Rating Descending" },
  { value: "vote_average.asc", label: "Rating Ascending" },
  {
    value: "primary_release_date.desc",
    label: "Release Date Descending",
  },
  { value: "primary_release_date.asc", label: "Release Date Ascending" },
  { value: "original_title.asc", label: "Title (A-Z)" },
];

const Explore = () => {
  const [data, setData] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [genre, setGenre] = useState(null);
  const [sortby, setSortby] = useState(null);
  const { mediaType, castId,name } = useParams();

  const { data: genresData } = useFetch(`/genre/${mediaType}/list`);
  if (castId) {
    filters = { with_cast: castId };
  }
  const fetchInitialData = () => {
    setLoading(true);
    fetchDataFromApi(`/discover/${mediaType}`, filters).then((res) => {
      setData(res);
      setPageNum((prev) => prev + 1);
      setLoading(false);
    });
  };

  const fetchNextPageData = () => {
    fetchDataFromApi(`/discover/${mediaType}?page=${pageNum}`, filters).then(
      (res) => {
        if (data?.results) {
          setData({
            ...data,
            results: [...data?.results, ...res.results],
          });
        } else {
          setData(res);
        }
        setPageNum((prev) => prev + 1);
      }
    );
  };

  useEffect(() => {
    filters = castId ? { with_cast: castId } : {};
    setData(null);
    setPageNum(1);
    setSortby(null);
    setGenre(null);
    fetchInitialData();
  }, [mediaType,castId]);

  const onChange = (selectedItems, action) => {
    if (action.name === "sortby") {
      setSortby(selectedItems);
      if (action.action !== "clear") {
        filters.sort_by = selectedItems.value;
      } else {
        delete filters.sort_by;
      }
    }

    if (action.name === "genres") {
      setGenre(selectedItems);
      if (action.action !== "clear") {
        let genreId = selectedItems.map((g) => g.id);
        genreId = JSON.stringify(genreId).slice(1, -1);
        filters.with_genres = genreId;
      } else {
        delete filters.with_genres;
      }
    }

    setPageNum(1);
    fetchInitialData();
  };

  return (
    <>
      {!(mediaType === "tv" && castId) ? (
        <div className="explorePage">
          <ContentWrapper>
            <div className="pageHeader">
              <div className="pageTitle">
                {mediaType === "tv" ? "Explore TV Shows" : "Explore Movies"}
                {castId? ` by ${name}`:""}
              </div>
              <div className="filters">
                <Select
                  isMulti
                  name="genres"
                  value={genre}
                  closeMenuOnSelect={false}
                  options={genresData?.genres}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => option.id}
                  onChange={onChange}
                  placeholder="Select genres"
                  className="react-select-container genresDD"
                  classNamePrefix="react-select"
                />
                <Select
                  name="sortby"
                  value={sortby}
                  options={sortbyData}
                  onChange={onChange}
                  isClearable={true}
                  placeholder="Sort by"
                  className="react-select-container sortbyDD"
                  classNamePrefix="react-select"
                />
              </div>
            </div>
            {loading && <Spinner initial={true} />}
            {!loading && (
              <>
                {data?.results?.length > 0 ? (
                  <InfiniteScroll
                    className="content"
                    dataLength={data?.results?.length || []}
                    next={fetchNextPageData}
                    hasMore={pageNum <= data?.total_pages}
                    loader={<Spinner />}
                  >
                    {data?.results?.map((item, index) => {
                      if (item.media_type === "person") return;
                      return (
                        <MovieCard
                          key={index}
                          data={item}
                          mediaType={mediaType}
                        />
                      );
                    })}
                  </InfiniteScroll>
                ) : (
                  <span className="resultNotFound">
                    Sorry, Results not found!
                  </span>
                )}
              </>
            )}
          </ContentWrapper>
        </div>
      ) : (
        <>
          <div
            style={{
              color: "white",
              width: "100%",
              height: "500px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                color: "white",
                fontSize: "2rem",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              Can not search by Cast in Tv Shows
            </h2>
          </div>
        </>
      )}
    </>
  );
};

export default Explore;
