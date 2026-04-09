import scipy.io

data = scipy.io.loadmat('Tail_666_9/666200402081508.mat', variable_names=['ALT', 'CAS', 'PTCH', 'ROLL', 'VRTG'], squeeze_me=True)
for p in ['ALT']:
    struct = data[p]
    raw_data = struct['data']
    print(raw_data.shape)
    if raw_data.ndim == 0:
        raw_data = raw_data.item() # extracts the ndarray from the 0-d array
    print(raw_data.shape)
