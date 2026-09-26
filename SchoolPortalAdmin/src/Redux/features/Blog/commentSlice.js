import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const commentSlice = createApi({
    reducerPath: "commentSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["comments", "comment"],
    endpoints: (builder) => ({
        // Get comments for a post (public)
        getComments: builder.query({
            query: (postId) => ({
                url: `v1/blog/comments/post/${postId}`,
                method: 'GET'
            }),
            providesTags: (result, error, postId) => [{ type: "comments", id: postId }]
        }),

        // Get user's comments
        getUserComments: builder.query({
            query: () => ({
                url: `v1/blog/comments/user`,
                method: 'GET'
            }),
            providesTags: ["comments"]
        }),

        // Create comment
        createComment: builder.mutation({
            query: (data) => ({
                url: `v1/blog/comments`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["comments"]
        }),

        // Update comment
        updateComment: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/blog/comments/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ["comments"]
        }),

        // Delete comment
        deleteComment: builder.mutation({
            query: (id) => ({
                url: `v1/blog/comments/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ["comments"]
        }),

        // Approve/Reject comment (admin only)
        approveComment: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/blog/comments/${id}/approve`,
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: ["comments"]
        }),

        // Like/Unlike comment
        toggleCommentLike: builder.mutation({
            query: (id) => ({
                url: `v1/blog/comments/${id}/like`,
                method: 'PATCH'
            }),
            invalidatesTags: ["comments"]
        }),

        // Get pending comments (admin only)
        getPendingComments: builder.query({
            query: () => ({
                url: `v1/blog/comments/pending/list`,
                method: 'GET'
            }),
            providesTags: ["comments"]
        }),

        // Get comment statistics (admin only)
        getCommentStats: builder.query({
            query: () => ({
                url: `v1/blog/comments/stats/overview`,
                method: 'GET'
            }),
            providesTags: ["comments"]
        })
    }),
});

export const {
    useGetCommentsQuery,
    useGetUserCommentsQuery,
    useCreateCommentMutation,
    useUpdateCommentMutation,
    useDeleteCommentMutation,
    useApproveCommentMutation,
    useToggleCommentLikeMutation,
    useGetPendingCommentsQuery,
    useGetCommentStatsQuery
} = commentSlice;
