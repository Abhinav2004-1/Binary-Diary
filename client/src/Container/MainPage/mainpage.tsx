import React, { useEffect, useState, Suspense, useRef, useMemo } from "react";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  useQuery,
  useLazyQuery,
} from "@apollo/client";
import {
  UserInfo,
  PROPS,
  POSTS,
  UserData,
  FollowingData,
  Suggestion,
} from "./interfaces";
import { FetchUserData, PostsData } from "../../GraphQL/gql";
import LoadingPage from "../../Components/UI/LoadingPage/LoadingPage";
import Navbar from "../../Components/MainPage/Navbar/navbar";
import DefaultProfile from "../../assets/Images/profile-user.svg";
import { Switch, Route, useHistory } from "react-router";
import { Convert2Dto1D, PostListSerialization } from "./helper";
import axios, { CancelTokenSource } from "axios";
import { useInteractionObserver } from "../../Hooks/InteractionObserver";
import SocketIOClient from 'socket.io-client';
import SuggestionContainer, {
  SuggestedUserCard,
} from "../../Components/MainPage/SearchSuggestion/suggestion";

const client = new ApolloClient({
  uri: "https://localhost:8000/graphql",
  cache: new InMemoryCache(),
});

const AsyncPostContainer = React.lazy(
  () => import("../../Components/MainPage/PostContainer/post-container")
);
const AsyncMessageContainer = React.lazy(
  () => import("../../Components/MainPage/MessageContainer/message-container")
);
const AsyncProfileContainer = React.lazy(
  () => import("../../Components/MainPage/ProfileContainer/profile-container")
);
const AsyncRequestContainer = React.lazy(
  () => import("../../Components/MainPage/RequestContainer/requests-container")
);

const MainPageWrapper: React.FC<PROPS> = (props) => {
  return (
    <React.Fragment>
      <ApolloProvider client={client}>
        <MainPage {...props} />
      </ApolloProvider>
    </React.Fragment>
  );
};

const MainPage: React.FC<PROPS> = React.memo((props) => {
  const { ChangeAuthentication } = props;
  const [user_info, setUserinfo] = useState<UserInfo | null>(null);
  const [profile_data, setProfileData] = useState<null | UserData>(null);
  const [postid_list, setPostIDList] = useState<null | Array<string>>(null);
  const [posts, setPosts] = useState<null | Array<POSTS>>(null);
  const [search_value, setSearchValue] = useState<string>("");
  const [profile_picture, setProfilePicture] = useState<string>(DefaultProfile);
  const [isfetchlimitreached, setIsFetchLimitReached] =
    useState<boolean>(false);
  const [request_count, setReqestCount] = useState<number>(0);
  const [search_suggestion, setSearchSuggestion] =
    useState<Array<Suggestion> | null>(null);
  const [search_suggestion_loading, setSearchSuggestionLoading] =
    useState<boolean>(false);
  const [socket, setSocket] = useState<null | SocketIOClient.Socket>(null);
  const LastCardRef = useRef<HTMLDivElement>(null);
  const history = useHistory();
  const cancelToken = useRef<CancelTokenSource>();
  const isInteracting = useInteractionObserver(LastCardRef);

  // apollo-client queries;
  const { loading } = useQuery(FetchUserData, {
    variables: {
      id: localStorage.getItem("userID"),
      uid: localStorage.getItem("uid"),
      auth_token: localStorage.getItem("auth-token"),
    },

    onCompleted: (data) => {
      const { GetUserData }: { GetUserData: UserData | null } = data;
      if (GetUserData) {
        const { FollowingList }: { FollowingList: Array<FollowingData> } =
          GetUserData;
        if (GetUserData.ProfilePicture.length > 0) {
          setProfilePicture(GetUserData.ProfilePicture);
        }
        if (FollowingList.length > 0) {
          const postIDs = Convert2Dto1D(FollowingList);
          const SlicedPostIDs = PostListSerialization(postIDs, 0);
          const config = {
            id: localStorage.getItem("userID"),
            uid: localStorage.getItem("uid"),
            auth_token: localStorage.getItem("auth-token"),
            Posts: SlicedPostIDs,
          };
          setPostIDList(postIDs);
          PostFetch({ variables: config });
        }
        setProfileData(GetUserData);
      }
    },
  });

  const AddPostsInPostState = (PostList: Array<POSTS>) => {
    if (posts) {
      const dummy = [...posts];
      for (let post of PostList) {
        dummy.push(post);
      }
      return dummy;
    }
    return PostList;
  };

  // eslint-disable-next-line
  const FetchMorePosts = () => {
    if (postid_list) {
      const SlicedPostIDs = PostListSerialization(postid_list, request_count);
      const config = {
        id: localStorage.getItem("userID"),
        uid: localStorage.getItem("uid"),
        auth_token: localStorage.getItem("auth-token"),
        Posts: SlicedPostIDs,
      };
      PostFetch({ variables: config });
    }
  };

  const [PostFetch, PostFetchConfig] = useLazyQuery(PostsData, {
    onCompleted: (data) => {
      const { GetPostsData }: { GetPostsData: Array<POSTS> | null } = data;
      if (GetPostsData) {
        const posts = AddPostsInPostState(GetPostsData);
        if (GetPostsData.length === 6) setIsFetchLimitReached(false);
        setPosts(posts);
        setReqestCount(request_count + 1);
      }
    },
  });

  // RenderFunctions
  const ChangeSearchValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);

    if (value.length > 3 && search_suggestion_loading) {
      cancelToken.current?.cancel();
    }

    if (value.length < 3) {
      search_suggestion && setSearchSuggestion(null);
    }

    if (value.length > 2) {
      const token = axios.CancelToken.source();
      cancelToken.current = token;
      setSearchSuggestionLoading(true);
      setTimeout(
        () =>  {
          axios
            .get(`/search-profile/${value}`, {
              cancelToken: token.token,
            })
            .then(({ data }) => {
              setSearchSuggestionLoading(false);
              setSearchSuggestion(data);
            })
            .catch(() => {
            })
        },
        200
      );
    }
  };

  const BlurSearchFocus = () => {
    if (search_suggestion) {
      setSearchSuggestion(null);
      setSearchValue("");
    }
  };

  const HomePressHandler = (event: React.MouseEvent<HTMLDivElement>) =>
    history.push("/posts");

  const SuggestionPressHandler = (event: React.MouseEvent<HTMLDivElement>) =>
    history.push("/suggestions");

  const MessagesPressHandler = (event: React.MouseEvent<HTMLDivElement>) =>
    history.push("/messages");

  const ProfilePressHandler = (event: React.MouseEvent<HTMLDivElement>) =>
    history.push(`/profile/${user_info?.userID}/1`);

  const SearchProfilePressHandler = (id: string) => {
    setSearchSuggestion(null);
    history.push(`/profile/${id}/0`);
  };
  // SideEffects and Effects;

  useEffect(() => {
    const auth_token = localStorage.getItem("auth-token");
    const username = localStorage.getItem("username");
    const userID = localStorage.getItem("userID");
    const uid = localStorage.getItem("uid");
    auth_token &&
      username &&
      userID &&
      uid &&
      setUserinfo({ auth_token, username, userID, uid });
  }, []);

  useEffect(() => {
    const io = SocketIOClient("https://localhost:8000").connect();
    io.emit("join-primary-room", localStorage.getItem('userID'));
    setSocket(io);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("real-time-request-receiver", () => {
        console.log('received')
      });
    }
    return () => {
      socket?.disconnect();
    }
  })

  useEffect(
    () => {
      if (postid_list) {
        if (
          isInteracting === true &&
          isfetchlimitreached === false &&
          postid_list.length > 6
        ) {
          FetchMorePosts();
          setIsFetchLimitReached(true);
        }
      }
    }, // eslint-disable-next-line
    [isInteracting]
  );

  const Suggestions = useMemo(
    () => {
      if (search_suggestion) {
        if (search_suggestion.length > 0) {
          const dummy = [...search_suggestion];
          return (
            <>
              <SuggestionContainer>
                {dummy.map((data) => {
                  return (
                    <SuggestedUserCard
                      id={data.id}
                      Click={SearchProfilePressHandler}
                      key={data.id}
                      Username={data.Username}
                      source={
                        data.ProfilePicture.length > 0
                          ? data.ProfilePicture
                          : DefaultProfile
                      }
                    />
                  );
                })}
              </SuggestionContainer>
            </>
          );
        }
      }
    }, // eslint-disable-next-line
    [search_suggestion]
  );

  if (loading === true || PostFetchConfig.loading === true) {
    return <LoadingPage />;
  }

  return (
    <React.Fragment>
      <Navbar
        HomePressHandler={HomePressHandler}
        MessagesPressHandler={MessagesPressHandler}
        ProfilePressHandler={ProfilePressHandler}
        SuggestionPressHandler={SuggestionPressHandler}
        change={ChangeSearchValue}
        value={search_value}
        ProfilePicture={profile_picture}
        Username={user_info?.username}
        Blur={BlurSearchFocus}
      />
      {Suggestions}
      <Switch>
        <Route
          exact
          path="/posts"
          render={() => {
            return (
              <Suspense fallback={<LoadingPage />}>
                <AsyncPostContainer
                  ProfileData={profile_data}
                  reference={LastCardRef}
                  PostList={posts}
                  UserInfo={user_info}
                />
              </Suspense>
            );
          }}
        />
        <Route
          exact
          path="/profile/:id/:owned"
          render={() => {
            return (
              <Suspense fallback={<LoadingPage />}>
                <AsyncProfileContainer
                  userInfo={user_info}
                  ProfilePicture={profile_picture}
                  ProfileData={profile_data}
                  ChangeAuthentication={ChangeAuthentication}
                />
              </Suspense>
            );
          }}
        />
        <Route
          exact
          path="/messages"
          render={() => {
            return (
              <Suspense fallback={<LoadingPage />}>
                <AsyncMessageContainer />
              </Suspense>
            );
          }}
        />
        <Route
          exact
          path="/suggestions"
          render={() => {
            return (
              <Suspense fallback={<LoadingPage />}>
                <AsyncRequestContainer />
              </Suspense>
            );
          }}
        />
        <Route
          render={() => {
            return (
              <Suspense fallback={<LoadingPage />}>
                <AsyncPostContainer
                  ProfileData={profile_data}
                  reference={LastCardRef}
                  PostList={posts}
                  UserInfo={user_info}
                />
              </Suspense>
            );
          }}
        />
      </Switch>
    </React.Fragment>
  );
});

export default React.memo(MainPageWrapper);
