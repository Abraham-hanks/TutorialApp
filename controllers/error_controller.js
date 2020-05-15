

module.exports={
    errorResponse: (req, res, next)=>{
        const code = req.err.code;
        res.status(code).send({
            error:{
                status: req.err.status,
                message: req.err.message
            }
        })
    }
}