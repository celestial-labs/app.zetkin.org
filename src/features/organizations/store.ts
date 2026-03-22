import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Dayjs } from 'dayjs';
import { DateRange } from '@mui/x-date-pickers-pro';

import {
  SuborgLoadingError,
  SuborgResult,
  SuborgWithFullStats,
  TreeItemData,
} from './types';
import {
  remoteItem,
  RemoteItem,
  remoteItemUpdated,
  remoteList,
  RemoteList,
} from 'utils/storeUtils';
import {
  EventImageCropSettings,
  ZetkinEvent,
  ZetkinMembership,
  ZetkinOrganization,
  ZetkinSubOrganization,
} from 'utils/types/zetkin';

// TODO: Remove TEST_CROP_ORG once backend returns cover_file_crop in API response
const TEST_CROP_ORG: EventImageCropSettings = {
  eventListItem: {
    crop: { x: -13.299999999999997, y: 132.221875 },
    croppedAreaPercentages: {
      height: 6.368972959432797,
      width: 50,
      x: 26.605037725464303,
      y: 34.05124418276701,
    },
    zoom: 2,
  },
  orgEventPage: {
    crop: { x: 136.9, y: 273.621875 },
    croppedAreaPercentages: {
      height: 12.986087722479859,
      width: 50,
      x: 8.2376135287976,
      y: 17.092391157464064,
    },
    zoom: 2,
  },
  publicEventPage: {
    crop: { x: -33, y: -94.5390625 },
    croppedAreaPercentages: {
      height: 24.998218865773723,
      width: 66.66666666666667,
      x: 21.97656590880422,
      y: 49.66954830413096,
    },
    zoom: 1.5,
  },
};
import { findOrAddItem } from 'utils/storeUtils/findOrAddItem';

type OrgEventFilters = {
  customDatesToFilterBy: DateRange<Dayjs>;
  dateFilterState: 'today' | 'tomorrow' | 'thisWeek' | 'custom' | null;
  eventTypesToFilterBy: string[];
  geojsonToFilterBy: GeoJSON.Feature[];
  orgIdsToFilterBy: number[];
};

export interface OrganizationsStoreSlice {
  eventsByOrgId: Record<number, RemoteList<ZetkinEvent>>;
  filters: OrgEventFilters;
  orgList: RemoteList<ZetkinOrganization>;
  subOrgsByOrgId: Record<number, RemoteList<ZetkinSubOrganization>>;
  suborgsWithStats: RemoteList<SuborgResult>;
  statsBySuborgId: Record<
    number,
    RemoteItem<SuborgWithFullStats | SuborgLoadingError>
  >;
  treeDataList: RemoteList<TreeItemData>;
  userMembershipList: RemoteList<ZetkinMembership & { id: number }>;
}

const initialState: OrganizationsStoreSlice = {
  eventsByOrgId: {},
  filters: {
    customDatesToFilterBy: [null, null],
    dateFilterState: null,
    eventTypesToFilterBy: [],
    geojsonToFilterBy: [],
    orgIdsToFilterBy: [],
  },
  orgList: remoteList(),
  statsBySuborgId: {},
  subOrgsByOrgId: {},
  suborgsWithStats: remoteList(),
  treeDataList: remoteList(),
  userMembershipList: remoteList(),
};

const OrganizationsSlice = createSlice({
  initialState,
  name: 'organizations',
  reducers: {
    filtersUpdated: (
      state,
      action: PayloadAction<Partial<OrgEventFilters>>
    ) => {
      const updatedFilters = action.payload;
      state.filters = { ...state.filters, ...updatedFilters };
    },
    orgEventsLoad: (state, action: PayloadAction<number>) => {
      state.eventsByOrgId[action.payload] ||= remoteList();
      state.eventsByOrgId[action.payload].isLoading = true;
    },
    orgEventsLoaded: (
      state,
      action: PayloadAction<[number, ZetkinEvent[]]>
    ) => {
      const [orgId, events] = action.payload;
      const injected = events.map((e) =>
        e.cover_file?.id === 46 ? { ...e, cover_file_crop: TEST_CROP_ORG } : e
      );
      state.eventsByOrgId[orgId] = remoteList(injected);
      state.eventsByOrgId[orgId].loaded = new Date().toISOString();
    },
    orgFollowed: (state, action: PayloadAction<ZetkinMembership>) => {
      const membership = action.payload;

      const existingMembership = state.userMembershipList.items.find(
        (item) => item?.data?.organization.id === membership.organization.id
      );

      if (existingMembership?.data) {
        existingMembership.data.follow = true;
        existingMembership.loaded = new Date().toISOString();
      } else {
        const membershipWithId: ZetkinMembership & { id: number } = {
          ...membership,
          follow: true,
          id: membership.organization.id,
        };

        state.userMembershipList.items.push(
          remoteItem(membership.organization.id, {
            data: membershipWithId,
            loaded: new Date().toISOString(),
          })
        );
      }
    },
    orgUnfollowed: (state, action: PayloadAction<number>) => {
      const orgId = action.payload;

      const membershipToUpdate = state.userMembershipList.items.find(
        (membership) => membership.id === orgId
      );

      if (membershipToUpdate?.data) {
        membershipToUpdate.data.follow = false;
        membershipToUpdate.loaded = new Date().toISOString();
      }
    },
    organizationLoad: (state, action: PayloadAction<number>) => {
      const orgId = action.payload;
      const item = findOrAddItem(state.orgList, orgId);
      item.isLoading = true;
    },
    organizationLoaded: (state, action: PayloadAction<ZetkinOrganization>) => {
      const org = action.payload;
      remoteItemUpdated(state.orgList, org);
    },
    subOrgsLoad: (state, action: PayloadAction<number>) => {
      const orgId = action.payload;
      if (!state.subOrgsByOrgId[orgId]) {
        state.subOrgsByOrgId[orgId] = remoteList();
      }
      state.subOrgsByOrgId[orgId].isLoading = true;
    },
    subOrgsLoaded: (
      state,
      action: PayloadAction<[number, ZetkinSubOrganization[]]>
    ) => {
      const [orgId, subOrgs] = action.payload;

      state.subOrgsByOrgId[orgId] = remoteList(subOrgs);
      state.subOrgsByOrgId[orgId].loaded = new Date().toISOString();
      state.subOrgsByOrgId[orgId].isLoading = false;
    },
    suborgWithStatsLoad: (state, action: PayloadAction<number>) => {
      const id = action.payload;

      if (!state.statsBySuborgId[id]) {
        state.statsBySuborgId[id] = remoteItem(0);
      }

      state.statsBySuborgId[id].isLoading = true;
    },
    suborgWithStatsLoaded: (
      state,
      action: PayloadAction<[number, SuborgWithFullStats | SuborgLoadingError]>
    ) => {
      const [id, suborgWithStats] = action.payload;

      if (!state.statsBySuborgId[id]) {
        state.statsBySuborgId[id] = remoteItem(0);
      }

      state.statsBySuborgId[id] = remoteItem(id, {
        data: suborgWithStats,
        loaded: new Date().toISOString(),
      });
    },
    suborgsWithStatsLoad: (state) => {
      state.suborgsWithStats.isLoading = true;
    },
    suborgsWithStatsLoaded: (state, action: PayloadAction<SuborgResult[]>) => {
      const suborgsWithStats = action.payload;

      state.suborgsWithStats = remoteList(suborgsWithStats);
      state.suborgsWithStats.loaded = new Date().toISOString();
      state.suborgsWithStats.isLoading = false;
    },
    treeDataLoad: (state) => {
      state.treeDataList.isLoading = true;
    },
    treeDataLoaded: (state, action: PayloadAction<TreeItemData[]>) => {
      const treeData = action.payload;

      state.treeDataList = remoteList(treeData);
      state.treeDataList.loaded = new Date().toISOString();
      state.treeDataList.isLoading = false;
    },
    userMembershipsLoad: (state) => {
      state.userMembershipList.isLoading = true;
    },
    userMembershipsLoaded: (
      state,
      action: PayloadAction<ZetkinMembership[]>
    ) => {
      const memberships = action.payload;
      const membershipsWithIds = memberships.map((membership) => ({
        ...membership,
        id: membership.organization.id,
      }));
      state.userMembershipList = remoteList(membershipsWithIds);
      state.userMembershipList.loaded = new Date().toISOString();
      state.userMembershipList.isLoading = false;
    },
  },
});

export default OrganizationsSlice;
export const {
  filtersUpdated,
  orgEventsLoad,
  orgEventsLoaded,
  organizationLoaded,
  organizationLoad,
  orgFollowed,
  orgUnfollowed,
  treeDataLoad,
  treeDataLoaded,
  subOrgsLoad,
  subOrgsLoaded,
  suborgWithStatsLoad,
  suborgWithStatsLoaded,
  suborgsWithStatsLoad,
  suborgsWithStatsLoaded,
  userMembershipsLoad,
  userMembershipsLoaded,
} = OrganizationsSlice.actions;
