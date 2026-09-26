import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../../helpers/NetworkHelper";

export const postSlice = createApi({
    reducerPath: "postSlice",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["posts", "post"],
    endpoints: (builder) => ({
        // Get posts with role-based filtering
        listPosts: builder.query({
            query: (params = {}) => ({
                url: `v1/blog/posts`,
                method: 'GET',
                params: params
            }),
            providesTags: ["posts"]
        }),

        // Get published posts (public)
        getPublishedPosts: builder.query({
            query: (params = {}) => ({
                url: `v1/blog/posts/published`,
                method: 'GET',
                params: params
            }),
            providesTags: ["posts"]
        }),

        // Get featured posts
        getFeaturedPosts: builder.query({
            query: () => ({
                url: `v1/blog/posts/featured`,
                method: 'GET'
            }),
            providesTags: ["posts"]
        }),

        // Get posts by category
        getPostsByCategory: builder.query({
            query: ({ category, params = {} }) => ({
                url: `v1/blog/posts/category/${category}`,
                method: 'GET',
                params: params
            }),
            providesTags: ["posts"]
        }),

        // Get post by ID
        getPostById: builder.query({
            query: (id) => ({
                url: `v1/blog/posts/${id}`,
                method: 'GET'
            }),
            providesTags: (result, error, id) => [{ type: "post", id }]
        }),

        // Get post by slug
        getPostBySlug: builder.query({
            query: (slug) => ({
                url: `v1/blog/posts/slug/${slug}`,
                method: 'GET'
            }),
            providesTags: (result, error, slug) => [{ type: "post", id: slug }]
        }),

        // Create post
        createPost: builder.mutation({
            query: (data) => ({
                url: `v1/blog/posts`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ["posts"]
        }),

        // Update post
        updatePost: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/blog/posts/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: ["posts", "post"]
        }),

        // Delete post
        deletePost: builder.mutation({
            query: (id) => ({
                url: `v1/blog/posts/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ["posts"]
        }),

        // Approve/Reject post (admin only)
        approvePost: builder.mutation({
            query: ({ id, data }) => ({
                url: `v1/blog/posts/${id}/approve`,
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: ["posts", "post"]
        }),

        // Like/Unlike post
        toggleLike: builder.mutation({
            query: (id) => ({
                url: `v1/blog/posts/${id}/like`,
                method: 'PATCH'
            }),
            invalidatesTags: ["posts", "post"]
        }),

        // Increment view count
        incrementViewCount: builder.mutation({
            query: (id) => ({
                url: `v1/blog/posts/${id}/view`,
                method: 'PATCH'
            }),
            invalidatesTags: ["posts", "post"]
        }),

        // Get blog statistics (admin only)
        getBlogStats: builder.query({
            query: () => ({
                url: `v1/blog/posts/stats/overview`,
                method: 'GET'
            }),
            providesTags: ["posts"]
        })
    }),
});

export const {
    useListPostsQuery,
    useGetPublishedPostsQuery,
    useGetFeaturedPostsQuery,
    useGetPostsByCategoryQuery,
    useGetPostByIdQuery,
    useGetPostBySlugQuery,
    useCreatePostMutation,
    useUpdatePostMutation,
    useDeletePostMutation,
    useApprovePostMutation,
    useToggleLikeMutation,
    useIncrementViewCountMutation,
    useGetBlogStatsQuery
} = postSlice;
