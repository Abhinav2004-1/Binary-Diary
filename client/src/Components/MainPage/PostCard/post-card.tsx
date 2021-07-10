import React, { useEffect, useRef, useState } from "react";
import InteractionContainer, {
  Interactants,
} from "../PostContainer/Interaction/interaction";
import { AiOutlineLike, AiOutlinePlusCircle } from "react-icons/ai";
import { MdComment } from "react-icons/md";
import "./post-card.scss";
import { useLazyQuery, useMutation } from "@apollo/client";
import { PostLikeMutation } from "../../../GraphQL/mutations";
import { FetchPostComments } from "../../../GraphQL/gql";
import { COMMENTS } from "../CommentCard/inteface";
import { useInteractionObserver } from "../../../Hooks/IntersectionObserver";
import {
  AsyncCommentSection,
  POSTCARDPROPS,
  SerializeComments,
} from "./reusables";

const AsyncDefaultCommentSection = React.lazy(() => import("./reusables"));

const PostCard: React.FC<POSTCARDPROPS> = (props) => {
  const { children } = props;

  // state
  const [likeStatus, setLikeStatus] = useState<string>(
    props.isPostLiked ? "#00acee" : ""
  );
  const [isCommentVisible, setIsCommentVisible] = useState<boolean>(false);
  const [requestCount, setRequestCount] = useState<number>(0);
  const [comments, setComments] = useState<Array<COMMENTS> | null>(null);
  const lastCardRef = useRef<HTMLDivElement>(null);
  const isIntersecting = useInteractionObserver(lastCardRef);

  // apollo-client
  const [GetComments] = useLazyQuery(FetchPostComments, {
    onCompleted: (data) => {
      const { GetPostComments }: { GetPostComments: Array<COMMENTS> } = data;
      let SerializedComments = GetPostComments;
      if (comments) {
        SerializedComments = SerializeComments(comments, GetPostComments);
      }
      setComments(SerializedComments);
      setRequestCount(requestCount + 1);
    },
  });
  const [MutatePostLike] = useMutation(PostLikeMutation);

  const LikeClickHandler = (id: string) => {
    if (props.ChangeLikedPost) {
      if (likeStatus === "") {
        MutatePostLike({
          variables: {
            type: "like",
            id: props.UserInfo?.userID,
            Username: props.UserInfo?.username,
            auth_token: props.UserInfo?.auth_token,
            uid: props.UserInfo?.uid,
            PostID: id,
          },
        });
        props.ChangeLikedPost(false, props.id);
        setLikeStatus("#00acee");
      } else {
        MutatePostLike({
          variables: {
            type: "unlike",
            id: props.UserInfo?.userID,
            Username: props.UserInfo?.username,
            auth_token: props.UserInfo?.auth_token,
            uid: props.UserInfo?.uid,
            PostID: id,
          },
        });
        props.ChangeLikedPost(true, props.id);
        setLikeStatus("");
      }
    }
  };

  useEffect(() => {
    if (isIntersecting) {
    }
  }, [isIntersecting]);

  const CommentClickHandler = () => {
    if (!comments) {
      GetComments({
        variables: {
          id: props.UserInfo?.userID,
          auth_token: props.UserInfo?.auth_token,
          uid: props.UserInfo?.uid,
          PostID: props.id,
          requestCount,
        },
      });
    }
    setIsCommentVisible(true);
  };

  return (
    <React.Fragment>
      <main
        id="post-card-container"
        onClick={props.Click ? props.Click : undefined}
      >
        {children}
        <InteractionContainer>
          <Interactants
            id={props.id}
            hoverColor={likeStatus}
            Click={LikeClickHandler}
          >
            <AiOutlineLike />
          </Interactants>

          <Interactants id={props.id} hoverColor="#333" Click={() => {}}>
            <AiOutlinePlusCircle />
          </Interactants>

          <Interactants
            id={props.id}
            hoverColor="#333"
            Click={CommentClickHandler}
          >
            <MdComment />
          </Interactants>
        </InteractionContainer>
        {isCommentVisible ? (
          <AsyncCommentSection Comments={comments} />
        ) : (
          <AsyncDefaultCommentSection />
        )}
      </main>
    </React.Fragment>
  );
};

export default PostCard;