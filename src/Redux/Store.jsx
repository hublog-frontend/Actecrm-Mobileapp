import { configureStore } from '@reduxjs/toolkit';
import {
  userPermissionsReducer,
  childUsersReducer,
  downlineUsersReducer,
  leadFilterValuesReducer,
  followUpFilterValuesReducer,
  courseListReducer,
  areaListReducer,
  followUpStatusCountsReducer,
} from './Slice';

const store = configureStore({
  reducer: {
    userpermissions: userPermissionsReducer,
    childusers: childUsersReducer,
    downlineusers: downlineUsersReducer,
    leadfiltervalues: leadFilterValuesReducer,
    followupfiltervalues: followUpFilterValuesReducer,
    courselist: courseListReducer,
    arealist: areaListReducer,
    followupstatuscounts: followUpStatusCountsReducer,
  },
});

export default store;
