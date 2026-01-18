import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { get, post } from "api/api";
import { OrderLockStatus } from "api/types";
import { RootState } from "slices/store";

export const orderLockReducerName = "orderLock";

interface OrderLockState {
    lockStatus: OrderLockStatus;
    isLoading: boolean;
    error: string | null;
}

const initialState: OrderLockState = {
    lockStatus: {
        orders_locked: false,
        locked_by: null,
        locked_at: null,
        reason: "",
    },
    isLoading: false,
    error: null,
};

interface RejectValue {
    status: number;
    message: any;
}

export const fetchLockStatus = createAsyncThunk<
    OrderLockStatus,
    void,
    { state: RootState; rejectValue: RejectValue }
>(`${orderLockReducerName}/fetchLockStatus`, async (_, { rejectWithValue }) => {
    try {
        const response = await get<OrderLockStatus>("/api/hardware/orders/lock/");
        return response.data;
    } catch (e: any) {
        return rejectWithValue({
            status: e.response?.status || 500,
            message: e.response?.data || "Failed to fetch lock status",
        });
    }
});

export const toggleLock = createAsyncThunk<
    OrderLockStatus,
    { orders_locked: boolean; reason?: string },
    { state: RootState; rejectValue: RejectValue }
>(`${orderLockReducerName}/toggleLock`, async (lockData, { rejectWithValue }) => {
    try {
        const response = await post<OrderLockStatus>(
            "/api/hardware/orders/lock/",
            lockData
        );
        return response.data;
    } catch (e: any) {
        return rejectWithValue({
            status: e.response?.status || 500,
            message: e.response?.data || "Failed to toggle lock status",
        });
    }
});

const orderLockSlice = createSlice({
    name: orderLockReducerName,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchLockStatus.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchLockStatus.fulfilled, (state, { payload }) => {
            state.isLoading = false;
            state.lockStatus = payload;
            state.error = null;
        });
        builder.addCase(fetchLockStatus.rejected, (state, { payload }) => {
            state.isLoading = false;
            state.error = payload?.message || "Failed to fetch lock status";
        });

        builder.addCase(toggleLock.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(toggleLock.fulfilled, (state, { payload }) => {
            state.isLoading = false;
            state.lockStatus = payload;
            state.error = null;
        });
        builder.addCase(toggleLock.rejected, (state, { payload }) => {
            state.isLoading = false;
            state.error = payload?.message || "Failed to toggle lock status";
        });
    },
});

export const { reducer } = orderLockSlice;

// Selectors
export const lockStatusSelector = (state: RootState) =>
    state[orderLockReducerName].lockStatus;
export const isLoadingSelector = (state: RootState) =>
    state[orderLockReducerName].isLoading;
export const errorSelector = (state: RootState) => state[orderLockReducerName].error;
export const ordersLockedSelector = (state: RootState) =>
    state[orderLockReducerName].lockStatus.orders_locked;

export default reducer;
