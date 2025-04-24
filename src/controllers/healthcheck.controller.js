import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const healthCheck = asyncHandler(async (res, res) => {
  // TODO: build a healthcheck response that simply returns the OK status as a json with a message

});

export {
    healthCheck
}
