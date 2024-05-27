/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable react/jsx-no-undef */
/* eslint-disable react/prop-types */

import { FaRegComment, FaRegHeart, FaRegBookmark, FaTrash, FaRegEdit } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
  const [comment, setComment] = useState("");
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();
  const postOwner = post.user;
  const isLiked = post.likes?.includes(authUser._id);
  const [editing, setEditing] = useState(false);
  const [newContent, setNewContent] = useState(post.text);

  const isMyPost = authUser._id === post.user._id;

  const formattedDate = formatPostDate(post.createdAt);

const { mutate: editPost, isPending: isEditing } = useMutation({
  mutationFn: async () => {
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newContent }), // newContent should contain the updated text
      });

      if (!res.ok) {
        throw new Error("Failed to update post");
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw new Error(error);
    }
  },
  onSuccess: (data) => {
    toast.success("Post updated successfully");
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  },
  onError: (error) => {
    console.error('Error updating post:', error);
    toast.error(error.message);
  },
});



  const handleEditPost = (e) => {
    e.preventDefault();
    if (isEditing) return;
    editPost();
  };

  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/like/${post._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data;
    },
    onSuccess: (updatedLikes) => {
      queryClient.setQueryData(["posts"], (oldData) => {
        return oldData.map((p) => {
          if (p._id === post._id) {
            return { ...p, likes: updatedLikes };
          }
          return p;
        });
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/comment/${post._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: comment }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Comment posted successfully");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeletePost = () => {
    deletePost();
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (isCommenting) return;
    commentPost();
  };

  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };

  return (
    <>
      <div className='flex gap-2 items-start p-4 border-b border-gray-700'>
        <div className='avatar'>
          <Link to={`/profile/${postOwner.username}`} className='w-8 rounded-full overflow-hidden'>
            <img src={postOwner.profileImg || "/avatar-placeholder.png"} alt='Profile' />
          </Link>
        </div>
        <div className='flex flex-col flex-1'>
          <div className='flex gap-2 items-center'>
            <Link to={`/profile/${postOwner.username}`} className='font-bold'>
              {postOwner.fullName}
            </Link>
            <span className='text-gray-700 flex gap-1 text-sm'>
              <Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
              <span>·</span>
              <span>{formattedDate}</span>
            </span>
            {isMyPost && (
              <span className='flex justify-end flex-1'>
                {!isDeleting && (
                  <FaTrash className='cursor-pointer hover:text-red-500' onClick={handleDeletePost} />
                )}
                {isDeleting && <LoadingSpinner size='sm' />}
              </span>
            )}
          </div>
          <div className='flex flex-col gap-3 overflow-hidden'>
            {!editing ? (
              <span>{post.text}</span>
            ) : (
              <form onSubmit={handleEditPost}>
				<textarea
					className='textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800'
					value={newContent}
					onChange={(e) => setNewContent(e.target.value)} // Ensure this updates properly
					/>
                <div className='flex gap-2 mt-2'>
                  <button className='btn btn-primary btn-sm text-white' type='submit'>
                    {isEditing ? <LoadingSpinner size='md' /> : "Save"}
                  </button>
                  <button
                    className='btn btn-secondary btn-sm text-white'
                    type='button'
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {post.img && (
              <img
                src={post.img}
                className='h-80 object-contain rounded-lg border border-gray-700'
                alt='Post'
              />
            )}
          </div>
          <div className='flex justify-between mt-3'>
            <div className='flex gap-4 items-center w-2/3 justify-between'>
              <div
                className='flex gap-1 items-center cursor-pointer group'
                onClick={() => document.getElementById(`comments_modal${post._id}`).showModal()}
              >
                <FaRegComment className='w-4 h-4 text-slate-500 group-hover:text-sky-400' />
                <span className='text-sm text-slate-500 group-hover:text-sky-400'>
                  {post.comments?.length}
                </span>
              </div>
              <dialog id={`comments_modal${post._id}`} className='modal border-none outline-none'>
                <div className='modal-box rounded border border-gray-600'>
                  <h3 className='font-bold text-lg mb-4'>COMMENTS</h3>
                  <div className='flex flex-col gap-3 max-h-60 overflow-auto'>
                    {(!post.comments || post.comments.length === 0) && (
                      <p className='text-sm text-slate-500'>
                        No comments yet 🤔 Be the first one 😉
                      </p>
                    )}
                    {post.comments && post.comments.map((comment) => (
                      <div key={comment._id} className='flex gap-2 items-start'>
                        <div className='avatar'>
                          <div className='w-8 rounded-full'>
                            <img
                              src={comment.user.profileImg || "/avatar-placeholder.png"}
                              alt='Commenter'
                            />
                          </div>
                        </div>
                        <div className='flex flex-col'>
                          <div className='flex items-center gap-1'>
                            <span className='font-bold'>{comment.user.fullName}</span>
                            <span className='text-gray-700 text-sm'>
                              @{comment.user.username}
                            </span>
                          </div>
                          <div className='text-sm'>{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form
                    className='flex gap-2 items-center mt-4'
                    onSubmit={handlePostComment}
                  >
                    <input
                      type='text'
                      placeholder='Type your comment here...'
                      className='input input-bordered w-full focus:outline-none border-gray-600'
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button type='submit' className='btn btn-sm btn-primary'>
                      {isCommenting ? <LoadingSpinner size='sm' /> : "Post"}
                    </button>
                  </form>
                  <div className='modal-action'>
                    <button className='btn' onClick={() => window[`comments_modal${post._id}`].close()}>
                      Close
                    </button>
                  </div>
                </div>
              </dialog>
              <div
                className={`flex gap-1 items-center cursor-pointer group ${isLiked ? "text-red-500" : ""}`}
                onClick={handleLikePost}
              >
                <FaRegHeart
                  className={`w-4 h-4 ${isLiked ? "text-red-500" : "text-slate-500"} group-hover:text-red-500`}
                />
                <span className={`text-sm ${isLiked ? "text-red-500" : "text-slate-500"} group-hover:text-red-500`}>
                  {post.likes?.length}
                </span>
              </div>
              <div className='flex gap-1 items-center cursor-pointer group'>
                <BiRepost className='w-4 h-4 text-slate-500 group-hover:text-green-500' />
                <span className='text-sm text-slate-500 group-hover:text-green-500'>
                  {post.reposts?.length}
                </span>
              </div>
            </div>
            <div className='flex gap-4 items-center'>
              {isMyPost && (
                <FaRegEdit
                  className='w-4 h-4 text-slate-500 cursor-pointer hover:text-blue-500'
                  onClick={() => setEditing(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Post;
