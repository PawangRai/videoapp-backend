// asyncHanlder is a higher order function. A higher order function either takes in a function as a parameter or returns a function. Here, it is taking in a function.

// It is basically a wrapper that takes in a function

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
    }
}

export { asyncHandler }

// const asycnHandler = () => {}
// const asycnHandler = (func) => () => {}
// const asycnHandler = (func) => async () => {}



// const asycnHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }