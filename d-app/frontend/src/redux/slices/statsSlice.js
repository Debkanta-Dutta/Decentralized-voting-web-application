import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../services/api";

export const fetchCandidateCount = createAsyncThunk(
  "stats/fetchCandidateCount",
  async (_, thunkAPI) => {
    const res = await axios.get("/user/voter/get-candidate-no");
    return res.data.data.count;
  }
);

export const fetchVoterCount = createAsyncThunk(
  "stats/fetchVoterCount",
  async (_, thunkAPI) => {
    const res = await axios.get("/user/voter/get-voter-no");
    return res.data.data.count;
  }
);

const statsSlice = createSlice({
  name: "stats",
  initialState: {
    candidateCount: 0,
    voterCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Candidate Count
      .addCase(fetchCandidateCount.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCandidateCount.fulfilled, (state, action) => {
        state.loading = false;
        state.candidateCount = action.payload;
      })
      .addCase(fetchCandidateCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Voter Count
      .addCase(fetchVoterCount.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchVoterCount.fulfilled, (state, action) => {
        state.loading = false;
        state.voterCount = action.payload;
      })
      .addCase(fetchVoterCount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default statsSlice.reducer;
