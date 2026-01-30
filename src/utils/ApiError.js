//API Error Handling:

class ApiError extends Error{//extends Error means we are inheriting properties of 
                            // JavaScript’s built-in Error class
                            //So ApiError behaves like a normal error, 
                            // but we can add extra features to it.
    constructor(
        statuscode,
        message = "Something went wrong",
        errors=[],
        stack=""
    ){
        super(message)
        this.statuscode=statuscode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}