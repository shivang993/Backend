 const catchAsyncError = (theFunction) => (req, res, next) => {
    return(req,res,next) => {
        Promise.resolve(theFunction(req, res, next)).catch(next);
    }
}

export default catchAsyncError;