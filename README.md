
# Demo 
https://user-images.githubusercontent.com/67047467/194772012-cb383d1a-5ba5-4531-9869-059e31aa02a0.mp4

# Run Addon

`web-ext run`

# Run Backend 

`cd backend/ && npm install && npm start`

# Open TODOs

1.   (Addon) Bing and Yahoo seem to be non functional at the moment, not sure why (Needs investigation) 
1. (Backend) Real database for image caching (maybe sqlite, but a dedicated maria or postgres DB might be bettein the long term )
1. (Backend) Cache invalidation + update mechanic (if we use a real db ... this could also be handled by a DB macro)
1. (Backend) Use docker to isolate backend service
