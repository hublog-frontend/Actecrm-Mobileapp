import { configureStore } from '@reduxjs/toolkit';
import {
  userPermissionsReducer,
  childUsersReducer,
  downlineUsersReducer,
  leadFilterValuesReducer,
  followUpFilterValuesReducer,
  junkLeadFilterValuesReducer,
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
    junkleadfiltervalues: junkLeadFilterValuesReducer,
    courselist: courseListReducer,
    arealist: areaListReducer,
    followupstatuscounts: followUpStatusCountsReducer,
  },
});

export default store;
