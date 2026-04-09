import scipy.io

data = scipy.io.loadmat('Tail_666_9/666200402081508.mat', variable_names=['ALT', 'CAS', 'PTCH', 'ROLL', 'VRTG'], squeeze_me=True)
for p in ['ALT']:
    struct = data[p]
    raw_data = struct['data']
    rate = float(struct['Rate']) if struct.dtype.names and 'Rate' in struct.dtype.names else 1.0
    units = str(struct['Units']) if struct.dtype.names and 'Units' in struct.dtype.names else ""
    desc = str(struct['Description']) if struct.dtype.names and 'Description' in struct.dtype.names else p
    print(type(raw_data), raw_data.shape, rate, units, desc)
