import { createSlice } from '@reduxjs/toolkit';

const initialState = [];

const userPermissionsSlice = createSlice({
  name: 'userpermissions',
  initialState,
  reducers: {
    storeUserPermissions(state, action) {
      return [...action.payload];
    },
  },
});

const childUsersSlice = createSlice({
  name: 'childusers',
  initialState,
  reducers: {
    storeChildUsers(state, action) {
      return [...action.payload];
    },
  },
});

const downlineUsersSlice = createSlice({
  name: 'downlineusers',
  initialState,
  reducers: {
    storeDownlineUsers(state, action) {
      return [...action.payload];
    },
  },
});

const leadFilterValues = {
  searchValue: null,
  filterType: 1,
  start_date: moment().subtract(6, 'days').format('YYYY-MM-DD'),
  end_date: moment().format('YYYY-MM-DD'),
  user_id: null,
  lead_source: null,
  call_get_leads_api: false,
  pageNumber: 1,
  pageLimit: 10,
};

const leadFilterValuesSlice = createSlice({
  name: 'leadfiltervalues',
  initialState: leadFilterValues,
  reducers: {
    storeLeadFilterValues(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    resetLeadFilterValues() {
      return leadFilterValues;
    },
  },
});

import moment from 'moment';

const followUpFilterValues = {
  searchValue: null,
  filterType: 1,
  start_date: moment().subtract(6, 'days').format('YYYY-MM-DD'),
  end_date: moment().format('YYYY-MM-DD'),
  user_id: null,
  status_id: null,
  status_name: null,
  pageNumber: 1,
  pageLimit: 10,
};

const followUpFilterValuesSlice = createSlice({
  name: 'followupfiltervalues',
  initialState: followUpFilterValues,
  reducers: {
    storeFollowUpFilterValues(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    resetFollowUpFilterValues() {
      return followUpFilterValues;
    },
  },
});

const junkLeadFilterValues = {
  searchValue: null,
  filterType: 1,
  start_date: moment().subtract(6, 'days').format('YYYY-MM-DD'),
  end_date: moment().format('YYYY-MM-DD'),
  pageNumber: 1,
  pageLimit: 10,
};

const junkLeadFilterValuesSlice = createSlice({
  name: 'junkleadfiltervalues',
  initialState: junkLeadFilterValues,
  reducers: {
    storeJunkLeadFilterValues(state, action) {
      return {
        ...state,
        ...action.payload,
      };
    },
    resetJunkLeadFilterValues() {
      return junkLeadFilterValues;
    },
  },
});

const courseListSlice = createSlice({
  name: 'courselist',
  initialState,
  reducers: {
    storeCourseList(state, action) {
      return [...action.payload];
    },
  },
});

const areaListSlice = createSlice({
  name: 'arealist',
  initialState,
  reducers: {
    storeAreaList(state, action) {
      return [...action.payload];
    },
  },
});

const followUpStatusCountsSlice = createSlice({
  name: 'followupstatuscounts',
  initialState,
  reducers: {
    storeFollowupStatusCounts(state, action) {
      return [...action.payload];
    },
  },
});

export const { storeUserPermissions } = userPermissionsSlice.actions;
export const { storeChildUsers } = childUsersSlice.actions;
export const { storeDownlineUsers } = downlineUsersSlice.actions;
export const { storeLeadFilterValues, resetLeadFilterValues } =
  leadFilterValuesSlice.actions;
export const { storeFollowUpFilterValues, resetFollowUpFilterValues } =
  followUpFilterValuesSlice.actions;
export const { storeJunkLeadFilterValues, resetJunkLeadFilterValues } =
  junkLeadFilterValuesSlice.actions;
export const { storeCourseList } = courseListSlice.actions;
export const { storeAreaList } = areaListSlice.actions;
export const { storeFollowupStatusCounts } = followUpStatusCountsSlice.actions;

export const userPermissionsReducer = userPermissionsSlice.reducer;
export const childUsersReducer = childUsersSlice.reducer;
export const downlineUsersReducer = downlineUsersSlice.reducer;
export const leadFilterValuesReducer = leadFilterValuesSlice.reducer;
export const followUpFilterValuesReducer = followUpFilterValuesSlice.reducer;
export const junkLeadFilterValuesReducer = junkLeadFilterValuesSlice.reducer;
export const courseListReducer = courseListSlice.reducer;
export const areaListReducer = areaListSlice.reducer;
export const followUpStatusCountsReducer = followUpStatusCountsSlice.reducer;
