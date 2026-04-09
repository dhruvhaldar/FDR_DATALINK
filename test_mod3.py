import scipy.io

data = scipy.io.loadmat('Tail_666_9/666200402081508.mat', variable_names=['ALT', 'CAS', 'PTCH', 'ROLL', 'VRTG'], squeeze_me=True)
for p in ['ALT']:
    struct = data[p]
    raw_data = struct['data'].item()
    print(raw_data.shape)
