// backend/services/GeolocationService.js
const axios = require('axios');
const logger = require('../utils/logger');

class GeolocationService {
  constructor() {
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.googleMapsUrl = 'https://maps.googleapis.com/maps/api';
  }

  /**
   * Get address from coordinates (Reverse Geocoding)
   */
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      const response = await axios.get(
        `${this.googleMapsUrl}/geocode/json`,
        {
          params: {
            latlng: `${latitude},${longitude}`,
            key: this.googleMapsApiKey,
            language: 'fr'
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        return {
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components,
          placeId: result.place_id
        };
      } else {
        throw new Error('Adresse non trouvée');
      }
    } catch (error) {
      logger.error('Reverse geocoding error:', error.response?.data || error.message);
      throw new Error('Erreur lors de la récupération de l\'adresse');
    }
  }

  /**
   * Get coordinates from address (Geocoding)
   */
  async getCoordinatesFromAddress(address) {
    try {
      const response = await axios.get(
        `${this.googleMapsUrl}/geocode/json`,
        {
          params: {
            address: address,
            key: this.googleMapsApiKey,
            language: 'fr'
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: response.data.results[0].formatted_address,
          placeId: response.data.results[0].place_id
        };
      } else {
        throw new Error('Coordonnées non trouvées');
      }
    } catch (error) {
      logger.error('Geocoding error:', error.response?.data || error.message);
      throw new Error('Erreur lors de la récupération des coordonnées');
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // Distance in kilometers
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get route between two points
   */
  async getRoute(origin, destination) {
    try {
      const response = await axios.get(
        `${this.googleMapsUrl}/directions/json`,
        {
          params: {
            origin: `${origin.latitude},${origin.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            key: this.googleMapsApiKey,
            language: 'fr',
            mode: 'driving'
          }
        }
      );

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: leg.distance.value / 1000, // Convert to km
          duration: leg.duration.value / 60, // Convert to minutes
          distanceText: leg.distance.text,
          durationText: leg.duration.text,
          polyline: route.overview_polyline.points,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.text,
            duration: step.duration.text
          }))
        };
      } else {
        throw new Error('Route non trouvée');
      }
    } catch (error) {
      logger.error('Get route error:', error.response?.data || error.message);
      throw new Error('Erreur lors du calcul de l\'itinéraire');
    }
  }

  /**
   * Get optimized route for multiple destinations
   */
  async getOptimizedRoute(origin, destinations, returnToOrigin = false) {
    try {
      const waypoints = destinations.map(d => `${d.latitude},${d.longitude}`).join('|');

      const response = await axios.get(
        `${this.googleMapsUrl}/directions/json`,
        {
          params: {
            origin: `${origin.latitude},${origin.longitude}`,
            destination: returnToOrigin ? `${origin.latitude},${origin.longitude}` : waypoints.split('|').pop(),
            waypoints: `optimize:true|${waypoints}`,
            key: this.googleMapsApiKey,
            language: 'fr',
            mode: 'driving'
          }
        }
      );

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        
        // Get optimized order
        const waypointOrder = route.waypoint_order;
        const optimizedDestinations = waypointOrder.map(index => destinations[index]);
        
        return {
          optimizedOrder: waypointOrder,
          optimizedDestinations: optimizedDestinations,
          totalDistance: route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000,
          totalDuration: route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60,
          legs: route.legs.map(leg => ({
            distance: leg.distance.text,
            duration: leg.duration.text,
            startAddress: leg.start_address,
            endAddress: leg.end_address
          }))
        };
      } else {
        throw new Error('Route optimisée non trouvée');
      }
    } catch (error) {
      logger.error('Get optimized route error:', error.response?.data || error.message);
      throw new Error('Erreur lors de l\'optimisation de l\'itinéraire');
    }
  }

  /**
   * Get estimated time of arrival
   */
  async getETA(origin, destination) {
    try {
      const route = await this.getRoute(origin, destination);
      const eta = new Date(Date.now() + route.duration * 60 * 1000);
      
      return {
        eta: eta,
        durationMinutes: route.duration,
        distanceKm: route.distance
      };
    } catch (error) {
      logger.error('Get ETA error:', error);
      throw error;
    }
  }

  /**
   * Check if location is within service area
   */
  isWithinServiceArea(latitude, longitude, serviceAreas) {
    for (const area of serviceAreas) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        area.centerLat,
        area.centerLng
      );
      
      if (distance <= area.radiusKm) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get nearby places
   */
  async getNearbyPlaces(latitude, longitude, type = 'point_of_interest', radius = 1000) {
    try {
      const response = await axios.get(
        `${this.googleMapsUrl}/place/nearbysearch/json`,
        {
          params: {
            location: `${latitude},${longitude}`,
            radius: radius,
            type: type,
            key: this.googleMapsApiKey,
            language: 'fr'
          }
        }
      );

      if (response.data.status === 'OK') {
        return response.data.results.map(place => ({
          name: place.name,
          address: place.vicinity,
          location: place.geometry.location,
          types: place.types,
          rating: place.rating,
          placeId: place.place_id
        }));
      } else {
        return [];
      }
    } catch (error) {
      logger.error('Get nearby places error:', error.response?.data || error.message);
      throw new Error('Erreur lors de la recherche de lieux');
    }
  }

  /**
   * Autocomplete address search
   */
  async autocompleteAddress(input, location = null) {
    try {
      const params = {
        input: input,
        key: this.googleMapsApiKey,
        language: 'fr',
        components: 'country:tn' // Tunisia only
      };

      if (location) {
        params.location = `${location.latitude},${location.longitude}`;
        params.radius = 50000; // 50km
      }

      const response = await axios.get(
        `${this.googleMapsUrl}/place/autocomplete/json`,
        { params }
      );

      if (response.data.status === 'OK') {
        return response.data.predictions.map(prediction => ({
          description: prediction.description,
          placeId: prediction.place_id,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text
        }));
      } else {
        return [];
      }
    } catch (error) {
      logger.error('Autocomplete address error:', error.response?.data || error.message);
      throw new Error('Erreur lors de l\'autocomplétion');
    }
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(
        `${this.googleMapsUrl}/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: this.googleMapsApiKey,
            language: 'fr',
            fields: 'name,formatted_address,geometry,address_components'
          }
        }
      );

      if (response.data.status === 'OK') {
        const place = response.data.result;
        
        return {
          name: place.name,
          formattedAddress: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          addressComponents: place.address_components
        };
      } else {
        throw new Error('Lieu non trouvé');
      }
    } catch (error) {
      logger.error('Get place details error:', error.response?.data || error.message);
      throw new Error('Erreur lors de la récupération des détails');
    }
  }
}

module.exports = new GeolocationService();