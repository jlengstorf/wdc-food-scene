import { useCallback, useState, type FormEvent } from 'react';
import { Routes, Route, Outlet, Link, useParams } from 'react-router-dom';
import { SignInButton, UserButton } from '@clerk/clerk-react';
import {
	Authenticated,
	Unauthenticated,
	useMutation,
	useQuery,
} from 'convex/react';
import { MapPin } from 'lucide-react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import {
	APIProvider,
	InfoWindow,
	Map,
	Marker,
} from '@vis.gl/react-google-maps';

function Layout() {
	return (
		<>
			<header>
				<Link to="/" rel="home">
					A Nice Little Day Out
				</Link>

				<nav>
					<Link to="/">All Lists</Link>
					{/* <Link to="/add-place">Add a Place</Link> */}
					<Link to="/create-list">Create a List</Link>
				</nav>

				<Authenticated>
					<UserButton />
				</Authenticated>
				<Unauthenticated>
					<SignInButton />
				</Unauthenticated>
			</header>

			<main>
				<Outlet />
			</main>
		</>
	);
}

function AllLists() {
	const lists = useQuery(api.lists.getAll);

	return (
		<>
			<img
				src="https://images.unsplash.com/photo-1502174832274-bc176e52765a?q=80&w=2487&h=1400&auto=format&fit=crop&crop=auto&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
				alt="friends holding ice cream"
				className="hero"
			/>
			<section>
				<h1>A Nice Little Day Out</h1>
				<p>Have a nice little day out — curated by real people!</p>
				<div className="lists">
					{lists?.map((list) => {
						return (
							<div className="list" key={list._id}>
								<h3>
									<Link to={`list/${list._id}`}>{list.name}</Link>
								</h3>
								<p>{list.description}</p>
								<p className="details">
									<MapPin />
									{list.places.length}{' '}
									{list.places.length === 1 ? 'place' : 'places'}
								</p>
							</div>
						);
					})}
				</div>
			</section>
		</>
	);
}

function AddPlace() {
	return (
		<section>
			<h1>TODO: Add Place</h1>
		</section>
	);
}

function CreateList() {
	const lists = useQuery(api.lists.getAllByOwner);
	const places = useQuery(api.places.getAll);
	const createList = useMutation(api.lists.create);
	const addPlace = useMutation(api.lists.addPlace);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const data = new FormData(event.currentTarget);

		await createList({
			name: data.get('name') as string,
			description: data.get('description') as string,
			places: [],
		});
	}

	async function handleAddPlace(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const data = new FormData(event.currentTarget);

		await addPlace({
			note: data.get('note') as string,
			place_id: data.get('place_id') as Id<'places'>,
			list_id: data.get('list_id') as Id<'lists'>,
		});
	}

	return (
		<section>
			<h1>Create List</h1>

			<form onSubmit={(event) => handleSubmit(event)}>
				<label htmlFor="name">name</label>
				<input type="text" id="name" name="name" />

				<label htmlFor="description">description</label>
				<textarea id="description" name="description"></textarea>

				<button type="submit">Save</button>
			</form>

			<h2>Your Lists</h2>

			<div className="lists vertical">
				{lists?.map((list) => {
					return (
						<div className="list" key={list._id}>
							<h3>{list.name}</h3>
							<p>{list.description}</p>

							{list.places.length > 0 ? (
								<>
									<h4>Places</h4>
									<ul>
										{list.places.map(({ note, place }) => {
											if (!place?._id) {
												return null;
											}

											return (
												<li key={place._id}>
													{place.name} — {note}
												</li>
											);
										})}
									</ul>
								</>
							) : null}

							<div className="add-place">
								<h3>Add a place to this list</h3>
								<form onSubmit={handleAddPlace}>
									<label htmlFor="place">Choose a place to add</label>
									<select name="place_id" id="place">
										<option disabled defaultValue={''}>
											-- select a place --
										</option>

										{places?.map((place) => {
											return (
												<option value={place._id} key={place._id}>
													{place.name} ({place.address})
												</option>
											);
										})}
									</select>

									<label htmlFor="note">Why are you adding this place?</label>
									<textarea id="note" name="note"></textarea>

									<input type="hidden" name="list_id" value={list._id} />

									<button type="submit">Add</button>
								</form>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}

// @see https://visgl.github.io/react-google-maps/docs/api-reference/components/info-window
function List() {
	const { list_id } = useParams<{ list_id: Id<'lists'> }>();
	if (!list_id) {
		throw new Error('invalid list ID');
	}

	const list = useQuery(api.lists.getById, { list_id });

	const [infoWindowShown, setInfoWindowShown] = useState<string>();

	const handleMarkerClick = useCallback(
		(id: string) => setInfoWindowShown(id),
		[],
	);

	const handleClose = useCallback(() => setInfoWindowShown(undefined), []);

	return (
		<section>
			<APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
				<Map
					style={{ width: '100%', height: '300px' }}
					className="map"
					defaultCenter={{ lat: 45.54, lng: -122.67 }}
					gestureHandling={'greedy'}
					defaultZoom={12}
					disableDefaultUI={true}
				>
					{list?.places.map(({ place, note }) => (
						<>
							<Marker
								position={place?.geo}
								onClick={() => handleMarkerClick(place?._id)}
							/>

							{infoWindowShown == place._id ? (
								<InfoWindow
									position={{
										lat: place?.geo.lat + 0.01,
										lng: place?.geo.lng,
									}}
									onClose={handleClose}
								>
									<h2 style={{ margin: 0 }}>{place?.name}</h2>
									<p>{place?.address}</p>
									<p>{place?.description}</p>
									<p className="note">{note}</p>
								</InfoWindow>
							) : null}
						</>
					))}
				</Map>
			</APIProvider>
			<h1>{list?.name}</h1>
			<p>{list?.description}</p>
			<div className="places">
				{list?.places.map(({ place, note }) => {
					return (
						<div key={place?._id}>
							<h2>{place?.name}</h2>
							<p>Address: {place?.address}</p>
							<p>{place?.description}</p>
							<pre>{JSON.stringify(place?.geo, null, 2)}</pre>
							<div className="note">
								<p>{note}</p>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function NoMatch() {
	return (
		<div>
			<h1>Not Found</h1>
			<p>
				<Link to="/">&larr; back to all lists</Link>
			</p>
		</div>
	);
}

export function App() {
	return (
		<>
			<Routes>
				<Route path="/" element={<Layout />}>
					<Route index element={<AllLists />} />
					<Route path="add-place" element={<AddPlace />} />
					<Route path="create-list" element={<CreateList />} />

					<Route path="list/:list_id" element={<List />} />

					<Route path="*" element={<NoMatch />} />
				</Route>
			</Routes>
		</>
	);
}
