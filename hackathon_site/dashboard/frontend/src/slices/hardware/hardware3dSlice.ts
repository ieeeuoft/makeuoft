import {
    createAsyncThunk,
    createEntityAdapter,
    createSelector,
    createSlice,
    PayloadAction,
} from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "slices/store";

import { get, stripHostnameReturnFilters } from "api/api";
import { APIListResponse, Hardware, HardwareFilters } from "api/types";
import { displaySnackbar } from "slices/ui/uiSlice";

interface HardwareExtraState {
    isUpdateDetailsLoading: boolean;
    isLoading: boolean;
    isMoreLoading: boolean;
    error: string | null;
    next: string | null;
    filters: HardwareFilters;
    count: number;
    hardwareIdInProductOverview: number | null;
}

const extraState: HardwareExtraState = {
    isUpdateDetailsLoading: false,
    isLoading: false,
    isMoreLoading: false,
    error: null,
    next: null,
    filters: {},
    count: 0,
    hardwareIdInProductOverview: null,
};

// export const hardwareReducerName = "hardware";
export const hardwareReducerName = "hardware3d";

const hardwareAdapter = createEntityAdapter<Hardware>();
export const initialState = hardwareAdapter.getInitialState(extraState);
export type HardwareState = typeof initialState;

// Thunks
interface RejectValue {
    status: number;
    message: any;
}

export const getHardware3dWithFilters = createAsyncThunk<
    APIListResponse<Hardware>,
    { keepOld?: boolean } | undefined,
    { state: RootState; rejectValue: RejectValue; dispatch: AppDispatch }
>(
    `${hardwareReducerName}/getHardware3dWithFilters`,
    async (_, { dispatch, getState, rejectWithValue }) => {
        const filters = hardware3dFiltersSelector(getState());

        try {
            const response = await get<APIListResponse<Hardware>>(
                "/api/hardware/hardware/",
                filters
            );
            return response.data;
        } catch (e: any) {
            dispatch(
                displaySnackbar({
                    message: `Failed to fetch hardware data: Error ${e.response.status}`,
                    options: { variant: "error" },
                })
            );
            return rejectWithValue({
                status: e.response.status,
                message: e.response.data,
            });
        }
    }
);

export const getHardware3dNextPage = createAsyncThunk<
    APIListResponse<Hardware> | null,
    void,
    { state: RootState; rejectValue: RejectValue; dispatch: AppDispatch }
>(
    `${hardwareReducerName}/getHardware3dNextPage`,
    async (_, { dispatch, getState, rejectWithValue }) => {
        try {
            const nextFromState = hardware3dNextSelector(getState());
            if (nextFromState) {
                const { path, filters } = stripHostnameReturnFilters(nextFromState);
                const response = await get<APIListResponse<Hardware>>(path, filters);
                return response.data;
            }
            // return empty response if there is no nextURL
            return null;
        } catch (e: any) {
            dispatch(
                displaySnackbar({
                    message: `Failed to fetch hardware data: Error ${e.response.status}`,
                    options: { variant: "error" },
                })
            );
            return rejectWithValue({
                status: e.response.status,
                message: e.response.data,
            });
        }
    }
);

export const getUpdatedHardware3dDetails = createAsyncThunk<
    Hardware | null,
    number,
    { state: RootState; rejectValue: RejectValue; dispatch: AppDispatch }
>(
    `${hardwareReducerName}/getHardwareDetails`,
    async (hardware_id, { dispatch, getState, rejectWithValue }) => {
        try {
            const response = await get<Hardware>(
                `/api/hardware/hardware/${hardware_id}/`
            );
            return response.data;
        } catch (e: any) {
            dispatch(
                displaySnackbar({
                    message: `Failed to fetch hardware data: Error ${e.response.status}`,
                    options: { variant: "error" },
                })
            );
            return rejectWithValue({
                status: e.response.status,
                message: e.response.data,
            });
        }
    }
);

// Slice
const hardwareSlice = createSlice({
    name: hardwareReducerName,
    initialState,
    reducers: {
        /**
         * Update the filters for the Hardware API
         *
         * To clear a particular filter, set the field to undefined.
         */
        setFilters: (
            state: HardwareState,
            { payload }: PayloadAction<HardwareFilters>
        ) => {
            const { in_stock, hardware_ids, category_ids, search, ordering } = {
                ...state.filters,
                ...payload,
            };

            // Remove values that are empty or falsy
            state.filters = {
                ...(in_stock && { in_stock }),
                ...(hardware_ids && hardware_ids.length > 0 && { hardware_ids }),
                ...(category_ids && category_ids.length > 0 && { category_ids }),
                ...(search && { search }),
                ...(ordering && { ordering }),
            };
        },

        clearFilters: (
            state: HardwareState,
            { payload }: PayloadAction<{ saveSearch?: boolean } | undefined>
        ) => {
            const { search } = state.filters;

            state.filters = {};

            if (payload?.saveSearch && search) {
                state.filters.search = search;
            }
        },

        removeProductOverviewItem: (state: HardwareState) => {
            state.hardwareIdInProductOverview = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(getHardware3dWithFilters.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });

        builder.addCase(
            getHardware3dWithFilters.fulfilled,
            (state, { payload, meta }) => {
                state.isLoading = false;
                state.error = null;
                state.next = payload.next;
                state.count = payload.count;

                if (meta.arg?.keepOld) {
                    hardwareAdapter.setMany(state, payload.results);
                } else {
                    hardwareAdapter.setAll(state, payload.results);
                }
            }
        );

        builder.addCase(getHardware3dWithFilters.rejected, (state, { payload }) => {
            state.isMoreLoading = false;
            state.error = payload?.message || "Something went wrong";
        });

        builder.addCase(getHardware3dNextPage.pending, (state) => {
            state.isLoading = false;
            state.isMoreLoading = true;
            state.error = null;
        });

        builder.addCase(getHardware3dNextPage.fulfilled, (state, { payload }) => {
            state.isMoreLoading = false;
            state.error = null;
            if (payload) {
                state.next = payload.next;
                state.count = payload.count;
                hardwareAdapter.addMany(state, payload.results);
            }
        });

        builder.addCase(getHardware3dNextPage.rejected, (state, { payload }) => {
            state.isMoreLoading = false;
            state.error = payload?.message || "Something went wrong";
        });

        builder.addCase(getUpdatedHardware3dDetails.pending, (state) => {
            state.isUpdateDetailsLoading = true;
        });

        builder.addCase(getUpdatedHardware3dDetails.fulfilled, (state, { payload }) => {
            if (payload) {
                state.isUpdateDetailsLoading = false;
                state.hardwareIdInProductOverview = payload.id;
                hardwareAdapter.updateOne(state, {
                    id: payload.id,
                    changes: payload,
                });
            }
        });

        builder.addCase(getUpdatedHardware3dDetails.rejected, (state, { payload }) => {
            state.isUpdateDetailsLoading = false;
        });
    },
});

export const { actions, reducer } = hardwareSlice;
export default reducer;

// export const { setFilters, clearFilters, removeProductOverviewItem } = actions;

// Selectors

export const {
    setFilters: set3dFilters,
    clearFilters: clear3dClearFilters,
    removeProductOverviewItem: remove3dProductOverviewItem,
} = actions;

export const hardwareSliceSelector = (state: RootState) => state[hardwareReducerName];
export const hardware3dSelectors = hardwareAdapter.getSelectors(hardwareSliceSelector);
// export const hardware3dSelectors = hardware3dSelectors;

export const is3dLoadingSelector = createSelector(
    [hardwareSliceSelector],
    (hardwareSlice) => hardwareSlice.isLoading
);

export const is3dMoreLoadingSelector = createSelector(
    [hardwareSliceSelector],
    (hardwareSlice) => hardwareSlice.isMoreLoading
);

export const is3dUpdateDetailsLoading = createSelector(
    [hardwareSliceSelector],
    (hardwareSlice) => hardwareSlice.isUpdateDetailsLoading
);

export const hardware3dCountSelector = createSelector(
    [hardwareSliceSelector],
    (hardwareSlice) => hardwareSlice.count
);

export const hardware3dFiltersSelector = createSelector(
    [hardwareSliceSelector],
    (hardwareSlice) => hardwareSlice.filters
);

export const hardware3dNextSelector = createSelector(
    [hardwareSliceSelector],
    (hardwareSlice) => hardwareSlice.next
);

export const selectHardwareByIds = createSelector(
    [hardware3dSelectors.selectEntities, (state: RootState, ids: number[]) => ids],
    (entities, ids) => ids.map((id) => entities?.[id])
);

export const hardware3dInProductOverviewSelector = createSelector(
    [hardware3dSelectors.selectEntities, hardwareSliceSelector],
    (entities, hardwareSlice) =>
        hardwareSlice.hardwareIdInProductOverview
            ? entities[hardwareSlice.hardwareIdInProductOverview]
            : null
);
